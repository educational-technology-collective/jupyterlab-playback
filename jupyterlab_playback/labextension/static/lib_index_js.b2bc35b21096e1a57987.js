"use strict";
(self["webpackChunkjupyterlab_playback"] = self["webpackChunkjupyterlab_playback"] || []).push([["lib_index_js"],{

/***/ "./lib/cm.js":
/*!*******************!*\
  !*** ./lib/cm.js ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createMetadataEditor: () => (/* binding */ createMetadataEditor),
/* harmony export */   highlightLinePlugin: () => (/* binding */ highlightLinePlugin)
/* harmony export */ });
/* harmony import */ var codemirror__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! codemirror */ "webpack/sharing/consume/default/codemirror/codemirror");
/* harmony import */ var codemirror__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(codemirror__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _codemirror_view__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @codemirror/view */ "webpack/sharing/consume/default/@codemirror/view");
/* harmony import */ var _codemirror_view__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_codemirror_view__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _codemirror_state__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @codemirror/state */ "webpack/sharing/consume/default/@codemirror/state");
/* harmony import */ var _codemirror_state__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_codemirror_state__WEBPACK_IMPORTED_MODULE_2__);



const map2doc = (map) => map ? map.map(lineMap => lineMap['command'].join('+')).join('\n') : '';
const doc2map = (doc) => doc.split('\n').map(line => ({ command: line.split('+') }));
const source2template = (source) => {
    const sourceLines = source.split('\n');
    const sourceLength = sourceLines.length || 0;
    const map = [];
    for (let i = 0; i < sourceLength; i++) {
        const sourceLine = sourceLines[i];
        if (/^\s*#/.test(sourceLine)) {
            // lines starting with '#' or ' #'
            map.push({ command: ['TYPE', 'AUDIO'] });
        }
        else if (/^\s*$/.test(sourceLine)) {
            // empty or contain only spaces
            map.push({ command: ['PAUSE500'] });
        }
        else {
            map.push({ command: ['TYPE'] });
        }
    }
    const doc = map2doc(map);
    return { map, doc };
};
// Fix errors caused by delayed loading of cells
const getCellInputWrapper = (notebookPanel, index) => new Promise(resolve => {
    const getElement = () => {
        const node = notebookPanel.content.widgets[index].node;
        const cellInputWrapper = node.getElementsByClassName('lm-Widget lm-Panel jp-Cell-inputWrapper')[0];
        if (cellInputWrapper) {
            resolve(cellInputWrapper);
        }
        else {
            requestAnimationFrame(getElement);
        }
    };
    getElement();
});
const createMetadataEditor = async (notebookPanel, metadataEditorWidth) => {
    var _a, _b;
    const length = ((_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.cells.length) || 0;
    for (let j = 0; j < length; j++) {
        const cell = (_b = notebookPanel.model) === null || _b === void 0 ? void 0 : _b.cells.get(j);
        if (cell && cell.type == 'code') {
            await notebookPanel.content.widgets[j].ready;
            const cellInputWrapper = await getCellInputWrapper(notebookPanel, j);
            const cellInputArea = cellInputWrapper.getElementsByClassName('jp-Cell-inputArea')[0];
            cellInputArea.classList.add('code-editor');
            cellInputArea.style.width = (100 - metadataEditorWidth).toString() + '%';
            const metadataEditor = document.createElement('div');
            metadataEditor.classList.add('metadata-editor');
            metadataEditor.style.width = metadataEditorWidth.toString() + '%';
            const initialState = cell.getMetadata('map')
                ? map2doc(cell.getMetadata('map'))
                : (() => {
                    const { map, doc } = source2template(cell.sharedModel.source);
                    cell.setMetadata('map', map);
                    return doc;
                })();
            const state = _codemirror_state__WEBPACK_IMPORTED_MODULE_2__.EditorState.create({
                doc: initialState,
                extensions: [
                    codemirror__WEBPACK_IMPORTED_MODULE_0__.basicSetup,
                    (0,_codemirror_view__WEBPACK_IMPORTED_MODULE_1__.lineNumbers)(),
                    _codemirror_view__WEBPACK_IMPORTED_MODULE_1__.EditorView.updateListener.of(update => {
                        if (update.docChanged) {
                            cell.setMetadata('map', doc2map(update.state.doc.toString()));
                        }
                    })
                ]
            });
            new _codemirror_view__WEBPACK_IMPORTED_MODULE_1__.EditorView({
                state,
                parent: metadataEditor
            });
            cellInputWrapper.appendChild(metadataEditor);
        }
    }
};
// Function to create a highlight plugin for a specific line
const highlightLinePlugin = (lineNumber) => {
    return _codemirror_view__WEBPACK_IMPORTED_MODULE_1__.ViewPlugin.fromClass(class {
        constructor(view) {
            this.decorations = this.createLineHighlight(view, lineNumber);
        }
        createLineHighlight(view, lineNumber) {
            const builder = new _codemirror_state__WEBPACK_IMPORTED_MODULE_2__.RangeSetBuilder();
            const line = view.state.doc.line(lineNumber);
            const lineDecoration = _codemirror_view__WEBPACK_IMPORTED_MODULE_1__.Decoration.line({ class: 'highlight-line' });
            builder.add(line.from, line.from, lineDecoration);
            return builder.finish();
        }
        update(update) {
            if (update.docChanged) {
                this.decorations = this.createLineHighlight(update.view, lineNumber);
            }
        }
    }, {
        decorations: v => v.decorations
    });
};


/***/ }),

/***/ "./lib/handler.js":
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   requestAPI: () => (/* binding */ requestAPI)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jupyterlab-playback', // API Namespace
    endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    let data = await response.text();
    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        }
        catch (error) {
            console.log('Not a JSON response body.', response);
        }
    }
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message || data);
    }
    return data;
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _cm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./cm */ "./lib/cm.js");
/* harmony import */ var _playback__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./playback */ "./lib/playback.js");






const plugin = {
    id: 'jupyterlab-playback:plugin',
    description: 'A JupyterLab extension.',
    autoStart: true,
    requires: [_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.INotebookTracker, _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_1__.ISettingRegistry],
    activate: async (app, notebookTracker, settingRegistry) => {
        console.log('JupyterLab extension jupyterlab-playback is activated!');
        const settings = await settingRegistry.load(plugin.id);
        const metadataEditorWidth = settings.get('metadataEditorWidth')
            .composite;
        notebookTracker.widgetAdded.connect(async (_, notebookPanel) => {
            var _a, _b, _c;
            await notebookPanel.revealed;
            await notebookPanel.sessionContext.ready;
            const button = document.createElement('button');
            button.id = 'extension-button';
            const node = document.createElement('div');
            node.appendChild(button);
            notebookPanel.toolbar.insertAfter('spacer', 'button', new _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__.Widget({ node: node }));
            const mode = (_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.getMetadata('mode');
            if (!mode)
                (_b = notebookPanel.model) === null || _b === void 0 ? void 0 : _b.setMetadata('mode', 'editor');
            if (!mode || mode === 'editor') {
                (0,_cm__WEBPACK_IMPORTED_MODULE_3__.createMetadataEditor)(notebookPanel, metadataEditorWidth);
                button.innerHTML = 'Generate an interactive notebook';
                button.onclick = async () => {
                    var _a, _b;
                    button.innerHTML = 'Generating notebook...';
                    const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_4__.requestAPI)('load', {
                        method: 'POST',
                        body: JSON.stringify({
                            data: (_a = notebookPanel === null || notebookPanel === void 0 ? void 0 : notebookPanel.model) === null || _a === void 0 ? void 0 : _a.toJSON(),
                            relativePath: (_b = notebookTracker.currentWidget) === null || _b === void 0 ? void 0 : _b.context.path
                        })
                    });
                    console.log(response);
                    button.innerHTML = 'Regenerate interactive notebook';
                };
            }
            else if (mode === 'player') {
                button.innerHTML = ' ▶ ';
                (_c = notebookPanel.model) === null || _c === void 0 ? void 0 : _c.setMetadata('isPlaying', false);
                button.onclick = () => {
                    var _a, _b;
                    const isPlaying = ((_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.getMetadata('isPlaying')) || false;
                    (_b = notebookPanel.model) === null || _b === void 0 ? void 0 : _b.setMetadata('isPlaying', !isPlaying);
                    if (!isPlaying)
                        (0,_playback__WEBPACK_IMPORTED_MODULE_5__.playback)(notebookPanel);
                };
            }
        });
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ }),

/***/ "./lib/playback.js":
/*!*************************!*\
  !*** ./lib/playback.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   playback: () => (/* binding */ playback)
/* harmony export */ });
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _codemirror_state__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @codemirror/state */ "webpack/sharing/consume/default/@codemirror/state");
/* harmony import */ var _codemirror_state__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_codemirror_state__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _cm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./cm */ "./lib/cm.js");




const stop = async (cellMap, i, j, notebookPanel) => {
    var _a, _b;
    const button = document.getElementById('extension-button');
    let jj = j;
    if ('audio_index' in cellMap[j]) {
        while (jj > 0 &&
            'audio_index' in cellMap[jj - 1] &&
            cellMap[jj - 1]['audio_index'] === cellMap[jj]['audio_index']) {
            jj -= 1;
        }
    }
    (_a = notebookPanel === null || notebookPanel === void 0 ? void 0 : notebookPanel.model) === null || _a === void 0 ? void 0 : _a.setMetadata('cellIndex', i);
    (_b = notebookPanel === null || notebookPanel === void 0 ? void 0 : notebookPanel.model) === null || _b === void 0 ? void 0 : _b.setMetadata('lineIndex', jj);
    if (button) {
        button.innerHTML = ' ▶ ';
    }
    const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_2__.requestAPI)('stop', {
        method: 'POST',
        body: ''
    });
};
const playback = async (notebookPanel) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const cells = (_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.cells;
    const cellIndex = ((_b = notebookPanel.model) === null || _b === void 0 ? void 0 : _b.getMetadata('cellIndex')) || 0;
    const lineIndex = ((_c = notebookPanel.model) === null || _c === void 0 ? void 0 : _c.getMetadata('lineIndex')) || 0;
    const button = document.getElementById('extension-button');
    if (cells) {
        if (button) {
            button.innerHTML = '||';
        }
        else {
            console.warn('null button');
        }
        let currentAudio = null;
        for (let i = cellIndex; i < cells.length; i++) {
            let source = '';
            const cell = cells.get(i);
            if (cell.type === 'code') {
                const cellMap = cell.getMetadata('full_map');
                for (let j = 0; j < (cellMap === null || cellMap === void 0 ? void 0 : cellMap.length); j++) {
                    const commands = cellMap[j]['command'];
                    const text = cellMap[j]['text'];
                    if (i === cellIndex && j < lineIndex) {
                        source += text;
                        if (j != (cellMap === null || cellMap === void 0 ? void 0 : cellMap.length) - 1)
                            source += '\n';
                        cell.sharedModel.setSource(source);
                    }
                    else {
                        const isPlaying = notebookPanel.model.getMetadata('isPlaying');
                        if (!isPlaying) {
                            await stop(cellMap, i, j, notebookPanel);
                            return;
                        }
                        if (commands.some((command) => command.includes('AUDIO'))) {
                            const audioSrc = cellMap[j]['audio_src'];
                            if (audioSrc !== currentAudio) {
                                currentAudio = audioSrc;
                                await (0,_handler__WEBPACK_IMPORTED_MODULE_2__.requestAPI)('audio', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        audio_src: currentAudio
                                    })
                                });
                            }
                        }
                        for (const command of commands) {
                            if (command.includes('TYPE')) {
                                const chunk = [...text];
                                if (j != (cellMap === null || cellMap === void 0 ? void 0 : cellMap.length) - 1)
                                    chunk.push('\n');
                                for (let char of chunk) {
                                    source += char;
                                    cell.sharedModel.setSource(source);
                                    await new Promise(resolve => {
                                        setTimeout(resolve, 50);
                                    });
                                    const isPlaying = notebookPanel.model.getMetadata('isPlaying');
                                    if (!isPlaying) {
                                        await stop(cellMap, i, j, notebookPanel);
                                        return;
                                    }
                                }
                            }
                            if (command.includes('PAUSE')) {
                                const time = command.replace(/\D/g, '');
                                source += '\n';
                                cell.sharedModel.setSource(source);
                                await new Promise(resolve => {
                                    setTimeout(resolve, time);
                                });
                            }
                            if (command.includes('SELECT')) {
                                const lineToHighlight = command.replace(/\D/g, '');
                                const cm = (_d = notebookPanel.content.widgets[i]) === null || _d === void 0 ? void 0 : _d.editor;
                                const highlightPlugin = (0,_cm__WEBPACK_IMPORTED_MODULE_3__.highlightLinePlugin)(lineToHighlight);
                                // Apply the highlight plugin to the existing instance
                                cm.editor.dispatch({
                                    effects: _codemirror_state__WEBPACK_IMPORTED_MODULE_1__.StateEffect.appendConfig.of([highlightPlugin])
                                });
                            }
                            if (command.includes('EXECUTE')) {
                                _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.NotebookActions.runCells(notebookPanel.content, [notebookPanel.content.widgets[i]], notebookPanel.context.sessionContext);
                            }
                        }
                    }
                }
            }
        }
    }
    if (button)
        button.innerHTML = ' ▶ '; // end of notebook or no cell available
    (_e = notebookPanel.model) === null || _e === void 0 ? void 0 : _e.setMetadata('cellIndex', '');
    (_f = notebookPanel.model) === null || _f === void 0 ? void 0 : _f.setMetadata('lineIndex', '');
    (_g = notebookPanel.model) === null || _g === void 0 ? void 0 : _g.setMetadata('isPlaying', false);
};


/***/ })

}]);
//# sourceMappingURL=lib_index_js.b2bc35b21096e1a57987.js.map