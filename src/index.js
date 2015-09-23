import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import R from 'ramda';

import AddRecordButton from 'components/cms/add_record_button';
import EditTableButton from 'components/cms/edit_table_button';
import CMSTabelSearcher from 'components/cms/table_searcher';
import CMSTable from 'components/cms/table';

import PageSubHeader from 'components/typography/page_sub_header';

import {dispatchLightbox, resetLightbox, dispatchAlert} from 'actions/ui';
import {updateCMSSetting} from 'actions/cms';

import loading from 'decorators/loading';

import * as Collection from 'helpers/collection';

/**
 * The `cmsViewCreator` is responsible for creating a CMS view
 * that has the ability to perform CRUD operations on any model.
 *
 * @param {String} cmsName the cms name must be unique and will
 * match the name of the cmsSetting record in the cmsSettings
 * collection in the database
 * @param {Object} options options hash
 * @function cmsViewCreator
 * @return {Class} CMSView
 */
const cmsViewCreator = (cmsName, options) => {
    /**
     * Lightly wraps the CMSTable component to provide a cleaner
     * interface.
     *
     * @class CMSTableWrapper
     */
    @loading('request') class CMSTableWrapper extends Component {

        static propTypes = {
            dispatchAlert: PropTypes.func.isRequired,
            dispatchLightbox: PropTypes.func.isRequired,
            filter: PropTypes.string.isRequired,
            form: PropTypes.func,
            recordName: PropTypes.string.isRequired,
            removeRecordAction: PropTypes.func,
            removeRecordPrompt: PropTypes.object,
            request: PropTypes.object.isRequired,
            resetLightbox: PropTypes.func.isRequired,
            settings: PropTypes.object.isRequired,
            showDetails: PropTypes.bool.isRequired,
            updateRecordAction: PropTypes.func
        }

        static defaultProps = {
            settings: {
                aliases: [],
                defaultSort: null,
                name: null,
                visableFields: []
            },
            showDetails: true
        }

        constructor(props) {
            super(props);

            this.hasConfigFile = !!props.settings.name;
        }

        render() {
            return (
                <CMSTable
                    actions={{
                        details: this.props.showDetails,
                        edit: {
                            action: this.props.updateRecordAction,
                            component: this.props.form
                        },
                        remove: {
                            action: this.props.removeRecordAction,
                            alert: this.props.removeRecordPrompt
                        }
                    }}
                    alias={R.mergeAll(this.props.settings.aliases)}
                    data={this.props.request.data}
                    defaultSort={this.props.settings.defaultSort}
                    filter={this.props.filter}
                    format={{}}
                    visableFields={this.props.settings.visableFields}
                    name={this.props.recordName}
                    dispatchLightbox={this.props.dispatchLightbox}
                    resetLightbox={this.props.resetLightbox}
                    dispatchAlert={this.props.dispatchAlert}
                />
            );
        }
    }

    /**
     * `CMSView` is a *smart component* and is the view that the
     * end user will see when looking at a cms endpoint. This
     * wraps the key features of the CMS like providing UI for
     * users to add records, edit table display, and view and modify
     * table data.
     *
     * @class CMSView
     */
    class CMSView extends Component {

        static propTypes = {
            createRecordAction: PropTypes.func,
            form: PropTypes.func,
            onLoadAction: PropTypes.func.isRequired,
            recordName: PropTypes.string,
            removeRecordAction: PropTypes.func,
            removeRecordPrompt: PropTypes.object,
            title: PropTypes.string.isRequired
        }

        static defaultProps = {
            title: `CMS ${cmsName}`
        }

        constructor(props) {
            super(props);

            this.state = {
                filter: ''
            }

            this.updateFilter = this.updateFilter.bind(this);
        }

        componentDidMount() {
            this.props.onLoadAction();
        }

        updateFilter(filter) {
            this.setState({filter: filter});
        }

        render() {
            return (
                <div>
                    <PageSubHeader title={`${this.props.title}`} />

                    <AddRecordButton
                        action={this.props.createRecordAction}
                        dispatchLightbox={this.props.dispatchLightbox}
                        resetLightbox={this.props.resetLightbox}
                        form={this.props.form}
                        name={this.props.recordName}
                    />

                    <EditTableButton
                        action={this.props.updateCMSSetting.bind(this, cmsName)}
                        dispatchLightbox={this.props.dispatchLightbox}
                        resetLightbox={this.props.resetLightbox}
                        data={this.props.request.data}
                        settings={this.props.settings}
                    />

                    <CMSTabelSearcher
                        onChange={this.updateFilter}
                    />

                    <CMSTableWrapper
                        form={this.props.form}

                        filter={this.state.filter}

                        recordName={this.props.recordName}
                        removeRecordAction={this.props.removeRecordAction}
                        removeRecordPrompt={this.props.removeRecordPrompt}
                        resetLightbox={this.props.resetLightbox}
                        request={this.props.request}
                        updateRecordAction={this.props.updateRecordAction}
                        dispatchLightbox={this.props.dispatchLightbox}
                        dispatchAlert={this.props.dispatchAlert}
                        settings={this.props.settings}
                    />
                </div>
            );
        }
    }

    const mapStateToProps = state => {
        return {
            request: state[`${cmsName}Reducer`],
            settings: Collection.getByPropName('name', cmsName, state.cmsReducer.data)
        }
    }

    /**
     * This method will clean props to pick out actions that
     * will be registered with redux's action creator.
     *
     * @function filterActions
     * @return {Object} filtered actions
     */
    const filterActions = () => {
        return R.pick([
            'createRecordAction',
            'onLoadAction',
            'removeRecordAction',
            'updateRecordAction'
        ], options);
    }

    const mergeDispatchAction = () => {
        const passedInActions = filterActions();

        const defaultActions = {
            dispatchAlert: dispatchAlert,
            dispatchLightbox: dispatchLightbox,
            resetLightbox: resetLightbox,
            updateCMSSetting: updateCMSSetting
        }

        return R.merge(defaultActions, passedInActions);
    }

    const addProps = (stateProps, dispatchProps, ownProps) => {
        const filteredProps = R.pick([
            'form',
            'recordName',
            'removeRecordPrompt',
            'showDetails',
            'title'
        ], options);

        return Object.assign({}, R.merge(ownProps, filteredProps), stateProps, dispatchProps);
    }

    return connect(
        mapStateToProps,
        mergeDispatchAction(),
        addProps
    )(CMSView);
}

export default cmsViewCreator;
