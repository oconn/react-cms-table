import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';

export default class EntryDetailsLightbox extends Component {

    static propTypes = {
        data: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            json: ''
        };
    }

    componentDidMount() {
        this.updateJSON();
    }

    // Modified from http://jsfiddle.net/unlsj/
    replacer(match, pIndent, pKey, pVal, pEnd) {
        const key = '<span class=json-key>';
        const val = '<span class=json-value>';
        const str = '<span class=json-string>';
        let r = pIndent || '';

        if (pKey) {
            r = `${r}${key}${pKey.replace(/[": ]/g, '')}${'</span>: '}`;
        }

        if (pVal) {
            r = `${r}${(pVal[0] == '"' ? str : val)}${pVal}${'</span>'}`;
        }

        return `${r}${(pEnd || '')}`;
    }

    prettyPrint(obj) {
        const jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;

        return JSON.stringify(obj, null, 3)
           .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
           .replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(jsonLine, this.replacer);
    }


    updateJSON() {
        this.setState({
            json: this.prettyPrint(this.props.data)
        });
    }

    render() {
        return (
            <pre className="json-output" dangerouslySetInnerHTML={{__html: this.state.json}} />
        );
    }
}
