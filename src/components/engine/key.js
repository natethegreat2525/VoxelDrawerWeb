export const Key = {
    _pressed: {},
  
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    W: 87,
    S: 83,
    A: 65,
    D: 68,
    
    isDown: function(keyCode) {
      return this._pressed[keyCode];
    },
    
    onKeydown: function(event) {
      this._pressed[event.keyCode] = true;
    },
    
    onKeyup: function(event) {
      delete this._pressed[event.keyCode];
    }
};

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);