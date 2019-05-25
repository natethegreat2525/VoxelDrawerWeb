import React from 'react';
import { getState, loadState } from './Main';

export default class Controls extends React.Component {

    constructor(props) {
        super(props);
        this.state = {r: 0, g: 0, b: 0, colors: [], selected: 0, w: 10, h: 10, d: 10};
    }

    componentWillMount() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    this.addColor(Math.floor(Math.sqrt(i/3.0)*255), Math.floor(Math.sqrt(j/3.0)*255), Math.floor(Math.sqrt(k/3.0)*255));
                }
            }
        }
        this.clickColor(0);
    }

    setColor(name) {
        return e => {
            this.setState({[name]: parseInt((e.target.value || 0) + '')});
        };
    }

    addColor(r, g, b) {
        if (typeof r === 'undefined') {
            r = this.state.r;
            g = this.state.g;
            b = this.state.b;
        }
        let colors = this.state.colors;
        colors.push({r,g,b});
        if (this.props.addColor) {
            this.props.addColor(colors[colors.length-1]);
        }
        this.setState({colors: colors}, () => {
            this.clickColor(colors.length - 1)();
        });
    }

    clickColor(idx) {
        return () => {
            if (this.props.selectColor) {
                this.props.selectColor(idx);
            }
            this.setState({
                r: this.state.colors[idx].r,
                g: this.state.colors[idx].g,
                b: this.state.colors[idx].b,
                selected: idx,
            });
        }
    }

    onSave() {
        this.setState({textValue: JSON.stringify(getState())})
    }

    onLoad() {
        let data = JSON.parse(this.state.textValue);
        if (!data) {
            return;
        }
        loadState(data);
        this.setState({w: data.w, h: data.h, d: data.d, colors: data.c.map(c => {return {r:c.r*255, g:c.g*255, b:c.b*255}})});
        this.clickColor(0)();
    }

    onTextUpdated(e) {
        this.setState({textValue: e.target.value});
    }

    onCopy() {
        document.getElementById('textInput').select();
        document.execCommand('copy');
    }

    resize() {
        if (this.props.resize) {
            this.props.resize(this.state.w, this.state.h, this.state.d);
        }
    }

    getPallette() {
        return this.state.colors.map((c, idx) => {
            let style = {
                padding: 0,
                margin: 1,
                borderWidth: 0,
                width: 20,
                height: 20,
                background: 'rgb('+c.r+', '+c.g+', '+c.b+')'
            };
            if (idx === this.state.selected) {
                style.borderWidth = '3px';
                style.borderStyle = 'solid';
                style.borderColor = 'black';
            }
            let button = <button
                key={idx}
                onClick={this.clickColor(idx)}
                style={style}/>;
            
            return button;
        });
    }

    render() {
        return (<div style={{display: 'flex', flexDirection: 'row'}}>
            <div>
                <div style={{padding: 5}}>
                    <div><button style={{padding: 0, borderWidth: 0, width: 40, height: 40, background: 'rgb('+this.state.r+', '+this.state.g+', '+this.state.b+')'}}></button></div>
                    <div>R: <input type='number' value={this.state.r} onChange={this.setColor('r')} /></div>
                    <div>G: <input type='number' value={this.state.g} onChange={this.setColor('g')}/></div>
                    <div>B: <input type='number' value={this.state.b} onChange={this.setColor('b')}/></div>
                    <div><button onClick={() => this.addColor()}>+</button></div>
                </div>
                <div style={{padding: 5, maxWidth: 370}}>
                    {this.getPallette()}
                </div>
                <div style={{padding: 5}}>
                    <button style={{margin: 5}} onClick={() => this.onSave()}>Save</button>
                    <button style={{margin: 5}} onClick={() => this.onLoad()}>Load</button>
                    <button style={{margin: 5}} onClick={() => this.onCopy()}>Copy</button>
                </div>
                <div style={{padding: 10}}>
                    <textarea id='textInput' value={this.state.textValue} onChange={e => this.onTextUpdated(e)}/>
                </div>
            </div>
            <div>
                <div style={{padding: 5}}>
                    <div>W: <input type='number' value={this.state.w} onChange={this.setColor('w')} /></div>
                    <div>H: <input type='number' value={this.state.h} onChange={this.setColor('h')} /></div>
                    <div>D: <input type='number' value={this.state.d} onChange={this.setColor('d')} /></div>
                    <button style={{margin: 5}} onClick={() => this.resize()}>Resize</button>
                </div>
            </div>
        </div>);
    }
}