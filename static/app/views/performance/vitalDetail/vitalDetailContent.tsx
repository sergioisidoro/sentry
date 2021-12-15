import * as React from 'react';
import {browserHistory, InjectedRouter} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import {Client} from 'sentry/api';
import Feature from 'sentry/components/acl/feature';
import Alert from 'sentry/components/alert';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {CreateAlertFromViewButton} from 'sentry/components/createAlertButton';
import SearchBar from 'sentry/components/events/searchBar';
import * as Layout from 'sentry/components/layouts/thirds';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {getParams} from 'sentry/components/organizations/globalSelectionHeader/getParams';
import * as TeamKeyTransactionManager from 'sentry/components/performance/teamKeyTransactionsManager';
import {IconChevron} from 'sentry/icons';
import {IconFlag} from 'sentry/icons/iconFlag';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';
import {generateQueryWithTag} from 'sentry/utils';
import EventView from 'sentry/utils/discover/eventView';
import {WebVital} from 'sentry/utils/discover/fields';
import MetricsRequest from 'sentry/utils/metrics/metricsRequest';
import {decodeScalar} from 'sentry/utils/queryString';
import Teams from 'sentry/utils/teams';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import withProjects from 'sentry/utils/withProjects';

import Breadcrumb from '../breadcrumb';
import MetricsSearchBar from '../metricsSearchBar';
import {MetricsSwitch} from '../metricsSwitch';
import {getTransactionSearchQuery} from '../utils';

import Table from './table';
import {vitalDescription, vitalMap, vitalToMetricsField} from './utils';
import VitalChart from './vitalChart';
import VitalInfo from './vitalInfo';
import VitalInfoMetrics from './vitalInfoMetrics';

const FRONTEND_VITALS = [WebVital.FCP, WebVital.LCP, WebVital.FID, WebVital.CLS];

type Props = {
  api: Client;
  location: Location;
  eventView: EventView;
  organization: Organization;
  projects: Project[];
  router: InjectedRouter;
  vitalName: WebVital;
  isMetricsData: boolean;
};

type State = {
  incompatibleAlertNotice: React.ReactNode;
  error: string | undefined;
};

function getSummaryConditions(query: string) {
  const parsed = new MutableSearch(query);
  parsed.freeText = [];

  return parsed.formatString();
}

class VitalDetailContent extends React.Component<Props, State> {
  state: State = {
    incompatibleAlertNotice: null,
    error: undefined,
  };

  handleSearch = (query: string) => {
    const {location} = this.props;

    const queryParams = getParams({
      ...(location.query || {}),
      query,
    });

    // do not propagate pagination when making a new search
    const searchQueryParams = omit(queryParams, 'cursor');

    browserHistory.push({
      pathname: location.pathname,
      query: searchQueryParams,
    });
  };

  generateTagUrl = (key: string, value: string) => {
    const {location} = this.props;
    const query = generateQueryWithTag(location.query, {key, value});

    return {
      ...location,
      query,
    };
  };

  handleIncompatibleQuery: React.ComponentProps<
    typeof CreateAlertFromViewButton
  >['onIncompatibleQuery'] = (incompatibleAlertNoticeFn, _errors) => {
    const incompatibleAlertNotice = incompatibleAlertNoticeFn(() =>
      this.setState({incompatibleAlertNotice: null})
    );
    this.setState({incompatibleAlertNotice});
  };

  renderCreateAlertButton() {
    const {eventView, organization, projects} = this.props;

    return (
      <CreateAlertFromViewButton
        eventView={eventView}
        organization={organization}
        projects={projects}
        onIncompatibleQuery={this.handleIncompatibleQuery}
        onSuccess={() => {}}
        referrer="performance"
      />
    );
  }

  renderVitalSwitcher() {
    const {vitalName, location} = this.props;

    const position = FRONTEND_VITALS.indexOf(vitalName);

    if (position < 0) {
      return null;
    }

    const previousDisabled = position === 0;
    const nextDisabled = position === FRONTEND_VITALS.length - 1;

    const switchVital = newVitalName => {
      return () => {
        browserHistory.push({
          pathname: location.pathname,
          query: {
            ...location.query,
            vitalName: newVitalName,
          },
        });
      };
    };

    return (
      <ButtonBar merged>
        <Button
          icon={<IconChevron direction="left" size="sm" />}
          aria-label={t('Previous')}
          disabled={previousDisabled}
          onClick={switchVital(FRONTEND_VITALS[position - 1])}
        />
        <Button
          icon={<IconChevron direction="right" size="sm" />}
          aria-label={t('Next')}
          disabled={nextDisabled}
          onClick={switchVital(FRONTEND_VITALS[position + 1])}
        />
      </ButtonBar>
    );
  }

  setError = (error: string | undefined) => {
    this.setState({error});
  };

  renderError() {
    const {error} = this.state;

    if (!error) {
      return null;
    }

    return (
      <Alert type="error" icon={<IconFlag size="md" />}>
        {error}
      </Alert>
    );
  }

  renderContent(vital: WebVital) {
    const {isMetricsData, location, organization, eventView, api} = this.props;
    const query = decodeScalar(location.query.query, '');
    const orgSlug = organization.slug;
    const {fields, start, end, statsPeriod, environment, project: projectIds} = eventView;

    if (isMetricsData) {
      const field = `p75(${vitalToMetricsField[vital]})`;
      return (
        <React.Fragment>
          <StyledMetricsSearchBar
            searchSource="performance_vitals_metrics"
            orgSlug={orgSlug}
            projectIds={eventView.project}
            query={query}
            onSearch={this.handleSearch}
          />
          <MetricsRequest
            api={api}
            orgSlug={orgSlug}
            start={start}
            end={end}
            statsPeriod={statsPeriod}
            project={projectIds}
            environment={environment}
            field={[field]}
            query={new MutableSearch(query).formatString()} // TODO(metrics): not all tags will be compatible with metrics
          >
            {({loading: isLoading, response}) => {
              const p75AllTransactions = response?.groups.reduce(
                (acc, group) => acc + group.totals[field],
                0
              );
              return (
                <React.Fragment>
                  <div>{'TODO'}</div>
                  <StyledVitalInfo>
                    <VitalInfoMetrics
                      api={api}
                      orgSlug={orgSlug}
                      start={start}
                      end={end}
                      statsPeriod={statsPeriod}
                      project={projectIds}
                      environment={environment}
                      vital={vital}
                      query={query}
                      p75AllTransactions={p75AllTransactions}
                      isLoading={isLoading}
                    />
                  </StyledVitalInfo>
                </React.Fragment>
              );
            }}
          </MetricsRequest>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <StyledSearchBar
          searchSource="performance_vitals"
          organization={organization}
          projectIds={projectIds}
          query={query}
          fields={fields}
          onSearch={this.handleSearch}
        />
        <VitalChart
          organization={organization}
          query={query}
          project={projectIds}
          environment={environment}
          start={start}
          end={end}
          statsPeriod={statsPeriod}
        />
        <StyledVitalInfo>
          <VitalInfo location={location} vital={vital} />
        </StyledVitalInfo>
      </React.Fragment>
    );
  }

  render() {
    const {location, eventView, organization, vitalName, projects} = this.props;
    const {incompatibleAlertNotice} = this.state;

    const vital = vitalName || WebVital.LCP;

    const filterString = getTransactionSearchQuery(location);
    const summaryConditions = getSummaryConditions(filterString);
    const description = vitalDescription[vitalName];

    return (
      <React.Fragment>
        <Layout.Header>
          <Layout.HeaderContent>
            <Breadcrumb
              organization={organization}
              location={location}
              vitalName={vital}
            />
            <Layout.Title>{vitalMap[vital]}</Layout.Title>
          </Layout.HeaderContent>
          <Layout.HeaderActions>
            <ButtonBar gap={1}>
              <MetricsSwitch onSwitch={() => this.handleSearch('')} />
              <Feature organization={organization} features={['incidents']}>
                {({hasFeature}) => hasFeature && this.renderCreateAlertButton()}
              </Feature>
              {this.renderVitalSwitcher()}
            </ButtonBar>
          </Layout.HeaderActions>
        </Layout.Header>
        <Layout.Body>
          {this.renderError()}
          {incompatibleAlertNotice && (
            <Layout.Main fullWidth>{incompatibleAlertNotice}</Layout.Main>
          )}
          <Layout.Main fullWidth>
            <StyledDescription>{description}</StyledDescription>
            {this.renderContent(vital)}
            <Teams provideUserTeams>
              {({teams, initiallyLoaded}) =>
                initiallyLoaded ? (
                  <TeamKeyTransactionManager.Provider
                    organization={organization}
                    teams={teams}
                    selectedTeams={['myteams']}
                    selectedProjects={eventView.project.map(String)}
                  >
                    <Table
                      eventView={eventView}
                      projects={projects}
                      organization={organization}
                      location={location}
                      setError={this.setError}
                      summaryConditions={summaryConditions}
                    />
                  </TeamKeyTransactionManager.Provider>
                ) : (
                  <LoadingIndicator />
                )
              }
            </Teams>
          </Layout.Main>
        </Layout.Body>
      </React.Fragment>
    );
  }
}

export default withProjects(VitalDetailContent);

const StyledDescription = styled('div')`
  font-size: ${p => p.theme.fontSizeMedium};
  margin-bottom: ${space(3)};
`;

const StyledSearchBar = styled(SearchBar)`
  margin-bottom: ${space(2)};
`;

const StyledVitalInfo = styled('div')`
  margin-bottom: ${space(3)};
`;

const StyledMetricsSearchBar = styled(MetricsSearchBar)`
  margin-bottom: ${space(2)};
`;
