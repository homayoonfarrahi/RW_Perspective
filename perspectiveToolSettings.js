var pTool = (function(pTool) {

    // Cross-File Private State
    var _private = pTool._private = pTool._private || {},
        _seal = pTool._seal = pTool._seal || function() {
            delete pTool._private;
            delete pTool._seal;
            delete pTool._unseal;
        },
        _unseal = pTool._unseal = pTool._unseal || function() {
            pTool._private = _private;
            pTool._seal = _seal;
            pTool._unseal = _unseal;
        };

    _private.PerspectiveToolSettings = {
        fillerPath: {
            fill: '#fff',
            stroke: '#fff',
            opacity: 0.4,
            strokeOpacity: 0.4
        },

        planeVertex: {
            fillIdle: '#00f',
            fillHoverIn: '#f00',
            opacity: 0.5
        },

        planeEdge: {
            stroke: '#00f',
            strokeHoverIn: '#f00',
            strokeWidth: 7,
            strokeOpacity: 0.3,
            strokeLinecap: 'round'
        },

        anchorLine: {
            widePath: {
                stroke: '#000',
                strokeWidth: 3,
                strokeOpacity: 0.5
            },

            narrowPath: {
                stroke: '#fff',
                strokeWidth: 1,
                strokeOpacity: 0.7
            },

            middlePath: {
                stroke: '#000',
                strokeWidth: 1,
                strokeOpacity: 1
            },

            handle: {
                fillIdle: '#00f',
                fillHoverIn: '#f00',
                opacity: 0.5
            }
        }
    };

    return pTool;

})(pTool || {});
