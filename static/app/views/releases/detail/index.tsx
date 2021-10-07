import {createContext} from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import pick from 'lodash/pick';

import Alert from 'app/components/alert';
import AsyncComponent from 'app/components/asyncComponent';
import LoadingIndicator from 'app/components/loadingIndicator';
import NoProjectMessage from 'app/components/noProjectMessage';
import GlobalSelectionHeader from 'app/components/organizations/globalSelectionHeader';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import PickProjectToContinue from 'app/components/pickProjectToContinue';
import {URL_PARAM} from 'app/constants/globalSelectionHeader';
import {IconInfo, IconWarning} from 'app/icons';
import {t} from 'app/locale';
import {PageContent} from 'app/styles/organization';
import space from 'app/styles/space';
import {
  Deploy,
  GlobalSelection,
  Organization,
  ReleaseMeta,
  ReleaseProject,
  ReleaseWithHealth,
  SessionApiResponse,
} from 'app/types';
import {formatVersion} from 'app/utils/formatters';
import routeTitleGen from 'app/utils/routeTitle';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';
import AsyncView from 'app/views/asyncView';

import {getReleaseBounds, ReleaseBounds} from '../utils';

import ReleaseHeader from './releaseHeader';

type ReleaseContextType = {
  release: ReleaseWithHealth;
  project: Required<ReleaseProject>;
  deploys: Deploy[];
  releaseMeta: ReleaseMeta;
  refetchData: () => void;
  hasHealthData: boolean;
  releaseBounds: ReleaseBounds;
};
const ReleaseContext = createContext<ReleaseContextType>({} as ReleaseContextType);

type RouteParams = {
  orgId: string;
  release: string;
};

type Props = RouteComponentProps<RouteParams, {}> & {
  organization: Organization;
  selection: GlobalSelection;
  releaseMeta: ReleaseMeta;
};

type State = {
  release: ReleaseWithHealth;
  deploys: Deploy[];
  sessions: SessionApiResponse | null;
} & AsyncView['state'];

class ReleasesDetail extends AsyncView<Props, State> {
  shouldReload = true;

  getTitle() {
    const {params, organization, selection} = this.props;
    const {release} = this.state;

    // The release details page will always have only one project selected
    const project = release?.projects.find(p => p.id === selection.projects[0]);

    return routeTitleGen(
      t('Release %s', formatVersion(params.release)),
      organization.slug,
      false,
      project?.slug
    );
  }

  getDefaultState() {
    return {
      ...super.getDefaultState(),
      deploys: [],
      sessions: null,
    };
  }

  getEndpoints(): ReturnType<AsyncComponent['getEndpoints']> {
    const {organization, location, params, releaseMeta} = this.props;

    const basePath = `/organizations/${organization.slug}/releases/${encodeURIComponent(
      params.release
    )}/`;

    const endpoints: ReturnType<AsyncView['getEndpoints']> = [
      [
        'release',
        basePath,
        {
          query: {
            adoptionStages: 1,
            ...getParams(pick(location.query, [...Object.values(URL_PARAM)])),
          },
        },
      ],
    ];

    if (releaseMeta.deployCount > 0) {
      endpoints.push(['deploys', `${basePath}deploys/`]);
    }

    // Used to figure out if the release has any health data
    endpoints.push([
      'sessions',
      `/organizations/${organization.slug}/sessions/`,
      {
        query: {
          project: location.query.project,
          environment: location.query.environment ?? [],
          query: `release:"${params.release}"`,
          field: 'sum(session)',
          statsPeriod: '90d',
          interval: '1d',
        },
      },
    ]);

    return endpoints;
  }

  renderError(...args) {
    const possiblyWrongProject = Object.values(this.state.errors).find(
      e => e?.status === 404 || e?.status === 403
    );

    if (possiblyWrongProject) {
      return (
        <PageContent>
          <Alert type="error" icon={<IconWarning />}>
            {t('This release may not be in your selected project.')}
          </Alert>
        </PageContent>
      );
    }

    return super.renderError(...args);
  }

  renderLoading() {
    return (
      <PageContent>
        <LoadingIndicator />
      </PageContent>
    );
  }

  renderBody() {
    const {organization, location, selection, releaseMeta} = this.props;
    const {release, deploys, sessions, reloading} = this.state;
    const project = release?.projects.find(p => p.id === selection.projects[0]);
    const releaseBounds = getReleaseBounds(release);

    if (!project || !release) {
      if (reloading) {
        return <LoadingIndicator />;
      }

      return null;
    }

    return (
      <NoProjectMessage organization={organization}>
        <StyledPageContent>
          <ReleaseHeader
            location={location}
            organization={organization}
            release={release}
            project={project}
            releaseMeta={releaseMeta}
            refetchData={this.fetchData}
          />
          <ReleaseContext.Provider
            value={{
              release,
              project,
              deploys,
              releaseMeta,
              refetchData: this.fetchData,
              hasHealthData: !!sessions?.groups[0].totals['sum(session)'],
              releaseBounds,
            }}
          >
            {this.props.children}
          </ReleaseContext.Provider>
        </StyledPageContent>
      </NoProjectMessage>
    );
  }
}

class ReleasesDetailContainer extends AsyncComponent<
  Omit<Props, 'releaseMeta'>,
  {releaseMeta: ReleaseMeta | null} & AsyncComponent['state']
> {
  shouldReload = true;

  getEndpoints(): ReturnType<AsyncComponent['getEndpoints']> {
    const {organization, params} = this.props;
    // fetch projects this release belongs to
    return [
      [
        'releaseMeta',
        `/organizations/${organization.slug}/releases/${encodeURIComponent(
          params.release
        )}/meta/`,
      ],
    ];
  }

  componentDidMount() {
    this.removeGlobalDateTimeFromUrl();
  }

  componentDidUpdate(prevProps, prevContext: Record<string, any>) {
    super.componentDidUpdate(prevProps, prevContext);
    this.removeGlobalDateTimeFromUrl();
  }

  removeGlobalDateTimeFromUrl() {
    const {router, location} = this.props;
    const {start, end, statsPeriod, utc, ...restQuery} = location.query;

    if (start || end || statsPeriod || utc) {
      router.replace({
        ...location,
        query: restQuery,
      });
    }
  }

  renderError(...args) {
    const has404Errors = Object.values(this.state.errors).find(e => e?.status === 404);

    if (has404Errors) {
      // This catches a 404 coming from the release endpoint and displays a custom error message.
      return (
        <PageContent>
          <Alert type="error" icon={<IconWarning />}>
            {t('This release could not be found.')}
          </Alert>
        </PageContent>
      );
    }

    return super.renderError(...args);
  }

  isProjectMissingInUrl() {
    const projectId = this.props.location.query.project;

    return !projectId || typeof projectId !== 'string';
  }

  renderLoading() {
    return (
      <PageContent>
        <LoadingIndicator />
      </PageContent>
    );
  }

  renderProjectsFooterMessage() {
    return (
      <ProjectsFooterMessage>
        <IconInfo size="xs" /> {t('Only projects with this release are visible.')}
      </ProjectsFooterMessage>
    );
  }

  renderBody() {
    const {organization, params, router} = this.props;
    const {releaseMeta} = this.state;

    if (!releaseMeta) {
      return null;
    }

    const {projects} = releaseMeta;

    if (this.isProjectMissingInUrl()) {
      return (
        <PickProjectToContinue
          projects={projects.map(({id, slug}) => ({
            id: String(id),
            slug,
          }))}
          router={router}
          nextPath={{
            pathname: `/organizations/${organization.slug}/releases/${encodeURIComponent(
              params.release
            )}/`,
          }}
          noProjectRedirectPath={`/organizations/${organization.slug}/releases/`}
        />
      );
    }

    return (
      <GlobalSelectionHeader
        lockedMessageSubject={t('release')}
        shouldForceProject={projects.length === 1}
        forceProject={
          projects.length === 1 ? {...projects[0], id: String(projects[0].id)} : undefined
        }
        specificProjectSlugs={projects.map(p => p.slug)}
        disableMultipleProjectSelection
        showProjectSettingsLink
        projectsFooterMessage={this.renderProjectsFooterMessage()}
        showDateSelector={false}
      >
        <ReleasesDetail {...this.props} releaseMeta={releaseMeta} />
      </GlobalSelectionHeader>
    );
  }
}

const StyledPageContent = styled(PageContent)`
  padding: 0;
`;

const ProjectsFooterMessage = styled('div')`
  display: grid;
  align-items: center;
  grid-template-columns: min-content 1fr;
  grid-gap: ${space(1)};
`;

export {ReleaseContext, ReleasesDetailContainer};
export default withGlobalSelection(withOrganization(ReleasesDetailContainer));
