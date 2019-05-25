import React from 'react';
import ReactDOM from 'react-dom';
import {initGraphics, selectColor, addColor, resize} from './components/Main';
import Controls from './components/controls';

let canvas = document.getElementById('canvas');

document.body.setAttribute('style', 'margin: 0px');

function start() {
    canvas.width = 800
    canvas.height = 600;

    let gl = canvas.getContext('webgl');
    if (!gl) {
        alert("WebGL not available.");
        return;
    }

    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    initGraphics(canvas, gl, canvas.width, canvas.height);
}

let root = document.getElementById('root');
ReactDOM.render(<Controls selectColor={selectColor} addColor={addColor} resize={resize} />, root);

start();