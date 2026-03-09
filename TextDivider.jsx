#target illustrator

if (app.documents.length === 0) {
    alert("Open a document first.");
} else {
    main();
}

function main() {
    var win = new Window("dialog", "Text Divider PRO (Fixed)");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 15;

    // --- MODE ---
    var modePnl = win.add("panel", undefined, "Mode");
    modePnl.orientation = "row";
    var splitBtn = modePnl.add("radiobutton", undefined, "Split");
    var joinBtn = modePnl.add("radiobutton", undefined, "Join");
    splitBtn.value = true;

    // --- SETTINGS ---
    var settingsPnl = win.add("panel", undefined, "Settings");
    settingsPnl.alignChildren = "left";

    settingsPnl.add("statictext", undefined, "Split/Join Type:");
    var typeList = settingsPnl.add("dropdownlist", undefined, ["Sentence", "Word", "Letter"]);
    typeList.selection = 0; // Default to Sentence

    settingsPnl.add("statictext", undefined, "Direction (Split Only):");
    var dirList = settingsPnl.add("dropdownlist", undefined, ["Vertical", "Horizontal"]);
    dirList.selection = 0;

    settingsPnl.add("statictext", undefined, "Spacing (px):");
    var spacingInput = settingsPnl.add("edittext", undefined, "40");
    spacingInput.characters = 10;

    var apply = win.add("button", undefined, "Apply", {name: "ok"});

    apply.onClick = function () {
        if (app.selection.length === 0) {
            alert("Please select a text object.");
            return;
        }

        var spacing = Number(spacingInput.text);
        if (isNaN(spacing)) { alert("Spacing must be a number."); return; }

        if (splitBtn.value) {
            doSplit(typeList.selection.text, dirList.selection.text, spacing);
        } else {
            doJoin(typeList.selection.text);
        }
        win.close();
    };

    win.show();
}

function doSplit(type, dir, spacing) {
    var sel = app.selection;
    
    // Loop backwards through selection to avoid indexing issues when removing items
    for (var s = sel.length - 1; s >= 0; s--) {
        var tf = sel[s];
        if (tf.typename !== "TextFrame") continue;

        var text = tf.contents;
        var arr = [];

        if (type === "Sentence") {
            // Updated Robust Regex: matches characters ending with . ! or ?
            // This works in older ExtendScript engines
            arr = text.match(/[^\.!\?]+[\.!\?]+[\s\r\n]*/g);
            
            // Fallback: If no punctuation found, just use the whole text
            if (!arr || arr.length === 0) arr = [text];
            
        } else if (type === "Word") {
            arr = text.split(/\s+/);
        } else if (type === "Letter") {
            arr = text.split("");
        }

        var basePos = [tf.position[0], tf.position[1]];
        
        for (var i = 0; i < arr.length; i++) {
            var content = arr[i].replace(/^[\s\r\n]+|[\s\r\n]+$/g, ""); // Trim spaces/newlines
            if (content === "") continue;

            var dup = tf.duplicate();
            dup.contents = content;

            if (dir === "Vertical") {
                dup.position = [basePos[0], basePos[1] - (i * spacing)];
            } else {
                dup.position = [basePos[0] + (i * spacing), basePos[1]];
            }
        }
        tf.remove(); // Remove the original combined block
    }
}

function doJoin(type) {
    var sel = app.selection;
    var textItems = [];
    
    for (var i = 0; i < sel.length; i++) {
        if (sel[i].typename === "TextFrame") textItems.push(sel[i]);
    }

    if (textItems.length < 2) {
        alert("Select at least 2 text frames to join.");
        return;
    }

    // Sort by position: Top to Bottom
    textItems.sort(function(a, b) {
        return b.position[1] - a.position[1];
    });

    var separator = (type === "Sentence" || type === "Word") ? " " : "";
    var newText = "";
    
    for (var j = 0; j < textItems.length; j++) {
        newText += textItems[j].contents + (j < textItems.length - 1 ? separator : "");
    }

    var firstItem = textItems[0];
    var joinedFrame = firstItem.duplicate();
    joinedFrame.contents = newText;

    for (var k = 0; k < textItems.length; k++) {
        textItems[k].remove();
    }
}