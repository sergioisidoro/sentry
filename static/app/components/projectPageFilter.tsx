import {useState} from 'react';
import {withRouter, WithRouterProps} from 'react-router';
import styled from '@emotion/styled';
import partition from 'lodash/partition';

import {updateProjects} from 'sentry/actionCreators/globalSelection';
import DropdownButton from 'sentry/components/dropdownButton';
import MultipleProjectSelector from 'sentry/components/organizations/multipleProjectSelector';
import PlatformList from 'sentry/components/platformList';
import {ALL_ACCESS_PROJECTS} from 'sentry/constants/pageFilters';
import {IconProject} from 'sentry/icons';
import {t} from 'sentry/locale';
import GlobalSelectionStore from 'sentry/stores/globalSelectionStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import space from 'sentry/styles/space';
import {MinimalProject} from 'sentry/types';
import {isActiveSuperuser} from 'sentry/utils/isActiveSuperuser';
import useOrganization from 'sentry/utils/useOrganization';
import useProjects from 'sentry/utils/useProjects';

type Props = {
  router: WithRouterProps['router'];

  /**
   * Message to display at the bottom of project list
   */
  footerMessage?: React.ReactNode;

  /**
   * Subject that will be used in a tooltip that is shown on a lock icon hover
   * E.g. This 'issue' is unique to a project
   */
  lockedMessageSubject?: string;

  /**
   * If true, there will be a back to issues stream icon link
   */
  showIssueStreamLink?: boolean;

  /**
   * If true, there will be a project settings icon link
   * (forceProject prop needs to be present to know the right project slug)
   */
  showProjectSettingsLink?: boolean;

  /**
   * Slugs of projects to restrict the project selector to
   */
  specificProjectSlugs?: string[];

  /**
   * A project will be forced from parent component (selection is disabled, and if user
   * does not have multi-project support enabled, it will not try to auto select a project).
   *
   * Project will be specified in the prop `forceProject` (since its data is async)
   */
  shouldForceProject?: boolean;

  /**
   * If a forced project is passed, selection is disabled
   */
  forceProject?: MinimalProject | null;
};

export function ProjectPageFilter({router, specificProjectSlugs, ...otherProps}: Props) {
  const [currentSelectedProjects, setCurrentSelectedProjects] = useState<number[] | null>(
    null
  );
  const {projects, initiallyLoaded: projectsLoaded} = useProjects();
  const organization = useOrganization();
  const {selection, isReady} = useLegacyStore(GlobalSelectionStore);

  const handleChangeProjects = (newProjects: number[] | null) => {
    setCurrentSelectedProjects(newProjects);
  };

  const handleUpdateProjects = () => {
    // Clear environments when switching projects
    updateProjects(currentSelectedProjects || [], router, {
      save: true,
      resetParams: [],
      environments: [],
    });
    setCurrentSelectedProjects(null);
  };

  const specifiedProjects = specificProjectSlugs
    ? projects.filter(project => specificProjectSlugs.includes(project.slug))
    : projects;

  const [_, otherProjects] = partition(specifiedProjects, project => project.isMember);

  const isSuperuser = isActiveSuperuser();
  const isOrgAdmin = organization.access.includes('org:admin');
  const nonMemberProjects = isSuperuser || isOrgAdmin ? otherProjects : [];

  const customProjectDropdown = ({getActorProps, selectedProjects, isOpen}) => {
    const selectedProjectIds = new Set(selection.projects);
    const hasSelected = !!selectedProjects.length;
    const title = hasSelected
      ? selectedProjects.map(({slug}) => slug).join(', ')
      : selectedProjectIds.has(ALL_ACCESS_PROJECTS)
      ? t('All Projects')
      : t('My Projects');
    const icon = hasSelected ? (
      <PlatformList
        platforms={selectedProjects.map(p => p.platform ?? 'other').reverse()}
        max={5}
      />
    ) : (
      <IconProject />
    );
    return (
      <StyledDropdownButton isOpen={isOpen} {...getActorProps()}>
        <DropdownTitle>
          {icon}
          {title}
        </DropdownTitle>
      </StyledDropdownButton>
    );
  };

  const customLoadingIndicator = (
    <StyledDropdownButton showChevron={false} disabled>
      <DropdownTitle>
        <IconProject />
        {t('Loading\u2026')}
      </DropdownTitle>
    </StyledDropdownButton>
  );

  return (
    <MultipleProjectSelector
      organization={organization}
      projects={projects}
      isGlobalSelectionReady={projectsLoaded && isReady}
      nonMemberProjects={nonMemberProjects}
      value={currentSelectedProjects || selection.projects}
      onChange={handleChangeProjects}
      onUpdate={handleUpdateProjects}
      customDropdownButton={customProjectDropdown}
      customLoadingIndicator={customLoadingIndicator}
      {...otherProps}
    />
  );
}

const StyledDropdownButton = styled(DropdownButton)`
  width: 100%;
  height: 40px;
`;

const DropdownTitle = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-gap: ${space(1)};
  align-items: center;
  white-space: nowrap;
`;

export default withRouter(ProjectPageFilter);
