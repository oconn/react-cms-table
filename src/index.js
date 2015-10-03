import React, {Component, PropTypes} from 'react';
import R from 'ramda';
import * as U from 'micro-lib-utils';
import EntryDetailsLightbox from './entry_details';
import Cog from './icons/cog';

/* ********* Helper Methods *********** */

/**
 * @param {Int} id record id
 * @param {Array} collection array of records
 * @param {String} idName name od database id property (Optional)
 * @function getById
 * @return {Object} record
 */
const getById = (id, collection, idName = idPropName) => {
    return R.find(R.propEq(idName, id))(collection);
}

/**
 * Returns an array of prop names for a given
 * data set.
 *
 * @param {Array} data data
 * @method getAllPropsFromData
 * @return {Array} prop names
 */
const getAllPropsFromData = (data) => {
    return R.reduce((memo, entry) => {
        const entryHeaders = R.keys(entry);

        return R.union(memo, entryHeaders);
    }, [], data);
}
/* ************************************ */


/**
 * Flexable table that takes a data set and constructs a table
 * based on that data.
 *
 * @class CMSTable
 */
export default class CMSTable extends Component {

    static propTypes = {
        actions: PropTypes.shape({
            details: PropTypes.bool,
            edit: PropTypes.shape({
                action: PropTypes.func.isRequired,
                component: PropTypes.func.isRequired
            }),
            remove: PropTypes.shape({
                action: PropTypes.func.isRequired,
                alert: PropTypes.object
            })
        }),
        alias: PropTypes.object.isRequired,
        data: PropTypes.array.isRequired,
        defaultSort: PropTypes.string,
        dispatchAlert: PropTypes.func.isRequired,
        dispatchLightbox: PropTypes.func.isRequired,
        filter: PropTypes.string.isRequired,
        format: PropTypes.object.isRequired,
        name: PropTypes.string.isRequired,
        resetLightbox: PropTypes.func.isRequired,
        visableFields: PropTypes.array.isRequired
    }

    static defaultProps = {
        // Sets aliases for column names
        alias: {},
        // Determins if actions can be taken on the data
        actions: {},
        // Sets a column to sort on
        defaultSort: null,
        // Used to format cell data
        format: {},
        // Sets fields to be shown
        visableFields: []
    }

    constructor(props) {
        super(props);

        this.state = {
            headers: this.getHeaders(props.data),
            sort: props.defaultSort,
            sortAscending: true
        };

        this.sortData = this.sortData.bind(this);
        this.filterData = this.filterData.bind(this);
    }

    /**
     * Determins all possible headers by reducing over the data.
     *
     * @param {Array} data All the table data
     * @method renderHeaders
     * @return {Array} header names
     */
    getHeaders(data = []) {
        if (R.not(R.isArrayLike(data))) {
            throw new Error('Data must be an array');
        }

        const allHeaders = getAllPropsFromData(data);

        return R.filter(header => {
            return R.contains(header, this.props.visableFields);
        }, allHeaders);
    }

    /**
     * Sorts data by selected column
     *
     * @param {Array} data data
     * @method sortData
     * @return {Array} sorted data
     */
    sortData(data = []) {
        if (R.not(R.isArrayLike(data))) {
            throw new Error('Data must be an array');
        }

        return R.sort((a, b) => {
            const valueA = a[this.state.sort] || '',
                valueB = b[this.state.sort] || '';

            return this.state.sortAscending ?
                valueA < valueB ? -1 : valueA > valueB ? 1 : 0 :
                valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }, data)
    }

    /**
     * Filters data by comparing each records props to the
     * filter string passed to props.
     *
     * @param {Array} data data
     * @method filterData
     * @return {Array} filtered data
     */
    filterData(data) {
        return R.filter(record => {
            const values = R.values(record);

            return R.reduce((memo, val) => {
                return R.test(new RegExp(this.props.filter, 'i'), val) ? true : memo;
            }, false, values);
        }, data);
    }

    /**
     * Formats the data to display to the table
     *
     * @param {Array} data data
     * @method formatData
     * @return {Array} data
     */
    formatData(data) {
        const filter = this.props.filter ? this.filterData : R.identity,
            sort = this.state.sort ? this.sortData : R.identity;

        return R.compose(
            sort,
            filter
        )(data);
    }

    /**
     * Updates the sort to be used on the table
     *
     * @param {String} sort name of proporty to sort on
     * @method updateSort
     * @return {Undefined} undefined
     */
    updateSort(sort) {
        this.setState({
            sort: sort,
            sortAscending: this.state.sort === sort ? !this.state.sortAscending : true
        });
    }

    /**
     * Renders the headers for the table
     *
     * @method renderHeaders
     * @return {JSX} header
     */
    renderHeaders() {
        return (
            <tr>
                {R.map(header => {
                    const headerName = this.props.alias[header] || U.capitialize(header);
                    const sortedOn = header === this.state.sort;
                    const className = sortedOn ?
                        this.state.sortAscending ?
                            'ascending' : 'descending' :
                        null;

                    return (
                        <th key={header}
                            className={className}
                            onClick={this.updateSort.bind(this, header)}>{headerName}</th>
                    );
                }, this.state.headers)}
            </tr>
        );
    }

    /**
     * Dispatches a provided componet and its props
     * to be displayed in a lightbox.
     *
     * @param {String} id of entry
     * @param {Function} Component react component
     * @method renderDetails
     * @return {Undefined} undefined
     */
    renderDetails(id, Component, props = {}) {
        const data = getById(id, this.props.data);

        if (Component) {
            this.props.dispatchLightbox(Component, R.merge({
                data: data,
                onSubmit: this.props.resetLightbox
            }, props));
        }
    }

    /**
     * Removes an entry. If an alert prop is passed in the remove action,
     * an alert will be dispatched prior to the remove action being executed.
     *
     * @param {String} id entry id
     * @method remove
     * @return {Undefined} undefined
     */
    remove(id) {
        const rmAction = this.props.actions.remove;

        if (rmAction.alert) {
            this.props.dispatchAlert(rmAction.alert).then(() => {
                rmAction.action(id);
            });
        } else {
            rmAction.action(id);
        }
    }

    /**
     * Appends actions to each row if specified in the CMSTable API
     *
     * @param {Object} data for a row
     * @param {String} id of record
     * @method appendActions
     * @return {Array} cells
     */
    appendActions(data, id) {
        const actions = this.props.actions;

        const details = (actions.details && id) ? (
            <img
                alt="Details Icon"
                className="cms-table-icon"
                src={`${IMG_BASE}/mag.svg`}
                title={`${this.props.name} Details`}
                onClick={this.renderDetails.bind(
                    this,
                    id,
                    EntryDetailsLightbox
                )}
            />
        ) : null;

        const edit = (actions.edit && id) ? (
            <img
                alt="Edit Icon"
                className="cms-table-icon"
                src={`${IMG_BASE}/cog.svg`}
                title={`Edit ${this.props.name}`}
                onClick={this.renderDetails.bind(
                    this,
                    id,
                    actions.edit.component,
                    {action: actions.edit.action}
                )}
            />
        ) : null;

        const remove = (actions.remove && id) ? (
            <img
                alt="Trash Icon"
                className="cms-table-icon"
                src={`${IMG_BASE}/trash.svg`}
                title={`Remove ${this.props.name}`}
                onClick={this.remove.bind(this, id)}
            />
        ) : null;

        const actionColumn = (
            <td key="cms-actions">
                {details}
                {edit}
                {remove}
            </td>
        );

        return R.append(actionColumn, data);
    }

    /**
     * Renders a single row of data
     *
     * @param {Object} record one row of data
     * @method renderDataRow
     * @return {JSX} row
     */
    renderDataRow(record) {
        const data = U.mapIndexed((val, idx) => {
            const dataPoint = record[val];

            let displayData = dataPoint && this.props.format[val] ?
                this.props.format[val](dataPoint) : dataPoint;

            displayData = R.is(Object, displayData) ? '[OBJECT]' : displayData;

            return <td key={idx}>{displayData}</td>;
        }, this.state.headers);

        return this.appendActions(data, record._id);
    }

    /**
     * Renders the body of the table
     *
     * @method renderDataRows
     * @return {JSX} table body
     */
    renderDataRows() {
        const data = this.formatData(this.props.data);

        return U.mapIndexed((record, idx) => {
            const className = idx % 2 === 0 ? 'even' : 'odd';

            return (
                <tr className={className} key={record._id || idx}>
                    {this.renderDataRow(record)}
                </tr>
            );
        }, data);
    }

    render() {
        return (
            <table className="cms-table">
                <thead>
                    {this.renderHeaders()}
                </thead>
                <tbody>
                    {this.renderDataRows()}
                </tbody>
            </table>
        );
    }
}

