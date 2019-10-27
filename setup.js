function createUI() {
    let zBody = z("div.container-fluid.h-100",
        z("div.row.h-100",
            z("div#program-container.h-100.col-3.p-0",
                z("textarea#editor.form-control")
            ),
            z("div#game-container.col.h-100",
                z("div.d-flex.flex-column.h-100",
                    z("div.row.btn-toolbar.mb-2.bg-blue.p-1",
                        z("button.btn.btn-success.mr-2#step", {type:"button"},
                            z("span.fa.fa-step-forward.mr-2", {"aria-hidden":"true"}),
                            "Step"
                        ),
                        z("button.btn.btn-success.mr-2#play", {type:"button"},
                            z("span.fa.fa-play.mr-2", {"aria-hidden":"true"}),
                            "Play"
                        ),
                        z("button.btn.btn-success.mr-2#pause", {type:"button"},
                            z("span.fa.fa-pause.mr-2", {"aria-hidden":"true"}),
                            "Pause"
                        ),
                        z("button.btn.btn-success.mr-2#clear", {type:"button"},
                            z("span.fa.fa-stop.mr-2", {"aria-hidden":"true"}),
                            "Clear"
                        ),
                        z("button.btn.btn-success.mr-2#zoom-out", {type:"button"},
                            z("span.fa.fa-search-minus.mr-2", {"aria-hidden":"true"}),
                            "Zoom out"
                        ),
                        z("button.btn.btn-success.mr-2#zoom-in", {type:"button"},
                            z("span.fa.fa-search-plus.mr-2", {"aria-hidden":"true"}),
                            "Zoom in"
                        ),
                        z("button.btn.btn-success.mr-2#zoom-reset", {type:"button"},
                            z("span.fa.fa-search.mr-2", {"aria-hidden":"true"}),
                            "Zoom reset"
                        ),
                    ),

                    z("div.row.flex-grow-1#wrapper-parent",
                        z("div#wrapper",
                            z("canvas#main-canvas")
                        ),
                    ),
                ),
            ),
        ),
    );

    $("body").html(zBody);

    let zoom = 1.0;
    let gameState = null;

    function programChanged() {
        let program = editor.getValue();
        stateProgramChanged(program);
        gameState = stateReset();

        let canvas = $("#main-canvas");

        renderInit(canvas.get(0), gameState.level.v, gameState.level.s, gameState.level.n, zoom);
        buttonPlayState(true);
        draw();
    }

    function zoomChange(factor) {
        let canvas = $("#main-canvas");
        if( factor == 0 ) {
            zoom = renderGetFullZoom(canvas, gameState.level.n);
        }
        else {
            zoom *= factor;
        }
        renderInit(canvas.get(0), gameState.level.v, gameState.level.s, gameState.level.n, zoom);
        draw();
    }

    function draw() {
        render(gameState.level.n, gameState.level.v);
    }

    function updateAndDraw() {
        stateUpdate();
        draw();
    }

    function buttonPlayState(play) {
        if(play) {
            $("#pause").addClass("d-none");
            $("#play").removeClass("d-none");
        }
        else {
            $("#pause").removeClass("d-none");
            $("#play").addClass("d-none");
        }
    }

    let editor = CodeMirror.fromTextArea( $("#editor").get(0), {
        lineNumbers: true,
        indentUnit: 4,
    });
    editor.on("change", function(cm, change) {
        programChanged();
    });
    editor.setSize("100%", "100%");

    // Play control handlers
    //-------------------------------------------------
    let runnerHandle = null;

    $("#step").click(function() {
        updateAndDraw();
    });

    $("#play").click( function() {
        buttonPlayState(false);
        runnerHandle = setInterval(updateAndDraw, 1);
    });

    $("#pause").click( function() {
        buttonPlayState(true);
        clearInterval(runnerHandle);
        runnerHandle = null;
    });

    $("#clear").click( function() {
        buttonPlayState(true);
        clearInterval(runnerHandle);
        stateReset();
        draw();
    });

    $("#zoom-out").click( function() {
        zoomChange(0.9);
    });

    $("#zoom-in").click( function() {
        zoomChange(1.1);
    });

    $("#zoom-reset").click( function() {
        zoomChange(0);
    });

    $("#wrapper").kinetic();

    editor.setValue(stateGet().program);
    zoomChange(0);
}
