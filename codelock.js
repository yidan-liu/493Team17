//Jake Sprintz
//EECS 493 Project


var set = false;
var id = "";
var ranges
var locker;
var user;
var lockowner;
var session;
var lockref;



//sets userid for the session, sets listener for db changes, triggers function to fill in existing locks
function initlock(userid, s, lr) {
    lockref = lr;
    user = userid;
    session = s;
    lockref.on('value', practice);
}


//any time db changes, this is called
//checks if a lock is being added or deleted
//if lock is being deleted, or this user is the owner of the new lock, nothing happens
//else lockowner is set to username and the lock is created in the codelock function
function practice(data){
    //console.log("in practice");
    var val = data.val();
     //console.log(val['username']);
    if(val['username'] == "none" || val['username'] == user){
        lockowner = user;
        unlock();
    }
    else{
        lockowner = val['username'];
        //console.log("username not none");
        ranges = val['range'].split(" ");
        //console.log(ranges);
        codelock();
    }
}


//lock can only be created if set==false
//creates the marker for highlighting and the keyboard handler for the actual locking useing the range from the db
function codelock() {
    //console.log("in codelock");
    //console.log(Number(ranges[0]));
    if(set == false){
        set = true;
        //console.log(ranges);
        var editor     = ace.edit("firepad-container")
            , session  = editor.getSession()
            , Range    = require("ace/range").Range
            , range    = new Range(Number(ranges[0]), Number(ranges[1]), Number(ranges[2]), Number(ranges[3]))
            , markerId = session.addMarker(range, "readonly-highlight");
      //  range2 = range;
        id = markerId;
        //console.log(range);
        session.setMode("ace/mode/javascript");
        locker = {
            handleKeyboard : function(data, hash, keyString, keyCode, event) {
                //console.log("handler");
                if (hash === -1 || (keyCode <= 40 && keyCode >= 37)) return false;

                if (intersects(range)) {
                    //console.log("actually intersects");
                    return {command:"null", passEvent:false};
                }
            }
        }
        editor.keyBinding.addKeyboardHandler(locker);
        //console.log(editor.getKeyboardHandler())
        before(editor, 'onPaste', preventReadonly);
        before(editor, 'onCut',   preventReadonly);

        range.start  = session.doc.createAnchor(range.start);
        range.end    = session.doc.createAnchor(range.end);
        range.end.$insertRight = true;

        function before(obj, method, wrapper) {
            var orig = obj[method];
            obj[method] = function() {
                var args = Array.prototype.slice.call(arguments);
                return wrapper.call(this, function(){
                    return orig.apply(obj, args);
                }, args);
            }

            return obj[method];
        }

        function intersects(range) {
            //console.log(editor.getSelectionRange());
            //console.log(range);
            return editor.getSelectionRange().intersects(range);
        }

        function preventReadonly(next, args) {
            //console.log("preventReadonly");
            if (intersects(range)) return;
            next();
        }
    }
};

//removes current lock and marker
function unlock(){
    ace.edit("firepad-container").getSession().removeMarker(id);
    ace.edit("firepad-container").keyBinding.removeKeyboardHandler(locker);
    set = false;
}


//if set is false, writes to the db with your current selection range and user ID
function writeLockData() {
    if(set == false){
        set = true;
      var range = ace.edit("firepad-container").getSelectionRange();
      var rangestring = range['start']['row'] + " " + range['start']['column'] + " " + range['end']['row'] + " " + range['end']['column'];
      // console.log(rangestring);
      lockref.set({

        username: user,
        range: rangestring,
        color: "blue"
     });
    }   
}

//allows you to overwrite the current lock in the db to destroy it if you are the owner
function deleteLockData() {
    if(lockowner == user){
        set = false;
        lockref.set({
            username: "none",
            range: "none",
            color: "none"
        });
    }
}   


//destroys lock regardless of owner, only for testing
function deleteOverride() {
        set = false;
        lockref.set({
            username: "none",
            range: "none",
            color: "none"
        });
}   