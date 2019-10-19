function createUI() {
    let zCanvas = z("canvas#main-canvas");

    let zMain = z("div.p-3",
        z("div.row",
            z("div.col-5",
                z("div#program-container"),
            ),
            z("div.col",
                z("div.btn-toolbar.mb-2",
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
                ),
                z("div", zCanvas),
            ),
        ),
    );

    $("#main").html(zMain);


    let zoom = 1.0;
    let gameState = null;

    function programChanged() {
        let program = editor.getValue();
        stateProgramChanged(program);
        gameState = stateReset();
        $(canvas).prop("width", gameState.level.n * d);
        $(canvas).prop("height", gameState.level.n * d);
        renderInit(canvas, gameState.level.v, gameState.level.s);
        buttonPlayState(true);
        draw();
    }

    function draw() {
        render(gameState.level.n, gameState.level.v, zoom);
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

    $("#program-container").html(
        z("div.container.editor",
            z("textarea#editor.form-control")
        )
    );

    let editor = CodeMirror.fromTextArea( $("#editor").get(0), {
        lineNumbers: true,
        indentUnit: 4,
    });
    editor.on("change", function(cm, change) {
        programChanged();
    });
    editor.setSize("100%", "100%");

    let canvas = $("#main-canvas")[0];

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
        updateAndDraw();
    });

    $("#zoom-out").click( function() {
        zoom *= 0.9;
        draw();
    });

    $("#zoom-in").click( function() {
        zoom *= 1.1;
        draw();
    });

    editor.setValue(stateGet().program);
}
