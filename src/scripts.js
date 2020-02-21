NewTab = function () {
    this.keymap = {
        'KeyA': {label: 'A'},
        'KeyB': {label: 'B'},
        'KeyC': {label: 'C'},
        'KeyD': {label: 'D'},
        'KeyE': {label: 'E'},
        'KeyF': {label: 'F'},
        'KeyG': {label: 'G'},
        'KeyH': {label: 'H'},
        'KeyI': {label: 'I'},
        'KeyJ': {label: 'J'},
        'KeyK': {label: 'K'},
        'KeyL': {label: 'L'},
        'KeyM': {label: 'M'},
        'KeyN': {label: 'N'},
        'KeyO': {label: 'O'},
        'KeyP': {label: 'P'},
        'KeyQ': {label: 'Q'},
        'KeyR': {label: 'R'},
        'KeyS': {label: 'S'},
        'KeyT': {label: 'T'},
        'KeyU': {label: 'U'},
        'KeyV': {label: 'V'},
        'KeyW': {label: 'W'},
        'KeyX': {label: 'X'},
        'KeyY': {label: 'Y'},
        'KeyZ': {label: 'Z'},
        'Space': {label: ''},
        'Period': {label: ','},
        'Comma': {label: '.'},
    };
    this.configMode = false;
    this.hotkeys = {};
    this.pressedKeys = {};
    this.buildKey = function (keyCode) {
        let keymap = this.keymap[keyCode],
            hotkey = this.hotkeys[keyCode] || {},
            keyElement = document.createElement(hotkey.url ? 'a' : 'div'),
            labelElement = document.createElement('span'),
            context = this;
        keyElement.id = 'key-' + keyCode;
        keyElement.classList.add('key');
        keyElement.tabIndex = -1;
        keyElement.onclick = function (event) {
            event.preventDefault();
            context.handleHotkey(keyCode);
        };
        labelElement.textContent = keymap.label;
        labelElement.classList.add('label');
        keyElement.appendChild(labelElement);
        if (hotkey.url) {
            keyElement.classList.add('configured');
            keyElement.title = hotkey.url;
            keyElement.href = hotkey.url;
        }
        return keyElement;
    };
    this.setup = function () {
        let layout = [
                ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
                ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
                ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Period', 'Comma'],
                ['Space'],
            ],
            keyboard = document.getElementById('keys');
        keyboard.innerHTML = '';
        for (let i = 0; i < layout.length; i++) {
            let keyboardRow = document.createElement('div');
            keyboardRow.classList.add('keyboard-row');
            for (let j = 0; j < layout[i].length; j++) {
                keyboardRow.appendChild(this.buildKey(layout[i][j]));
            }
            keyboard.appendChild(keyboardRow);
        }
    };
    this.onkeydown = function (event) {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        if (this.pressedKeys[event.code]) {
            return; // key is already pressed
        }
        this.pressedKeys[event.code] = true;
        console.log('Key down: ' + event.code + ' (' + event.key + ')');

        let keyElement = document.getElementById('key-' + event.code);
        if (keyElement) {
            keyElement.classList.add('pressed');
        }
    };
    this.onkeyup = function (event) {
        console.log('Key up: ' + event.code + ' (' + event.key + ')');
        delete this.pressedKeys[event.code];
        let keyElement = document.getElementById('key-' + event.code);
        if (keyElement) {
            this.handleHotkey(event.code, event.ctrlKey);
            event.preventDefault();
            keyElement.classList.remove('pressed');
        }
    };
    this.configureKey = function (keyCode) {
        let hotkey = this.hotkeys[keyCode],
            newUrl = prompt('Enter desired url', hotkey && hotkey.url || ''),
            context = this;
        chrome.storage.sync.get(['hotkeys'], function (result) {
            let hotkeys = result.hotkeys || {};
            hotkeys[keyCode] = null;
            if (newUrl) {
                hotkeys[keyCode] = {url: newUrl};
            }
            chrome.storage.sync.set({'hotkeys': hotkeys}, function () {
                context.hotkeys = hotkeys;
                document.getElementById('key-' + keyCode).replaceWith(
                    context.buildKey(keyCode)
                );
            });
        });
    };
    this.handleHotkey = function (keyCode) {
        let hotkey = this.hotkeys[keyCode];
        if (this.configMode) {
            this.configureKey(keyCode);
        } else if (hotkey) {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.create({
                    url: hotkey.url,
                    active: true,
                    index: tab.index
                });
                close();
            });
        }
    };
    this.init = function () {
        let that = this;
        if (document.hasFocus()) {
            document.body.classList.add('active');
        }
        window.addEventListener('focus', function () {
            document.body.classList.add('active');
        });
        window.addEventListener('blur', function () {
            document.body.classList.remove('active');
        });
        document.onkeydown = this.onkeydown.bind(this);
        document.onkeyup = this.onkeyup.bind(this);
        document.getElementById('configModeToggle').onclick = this.toggleConfigMode.bind(this);
        chrome.storage.sync.get(['hotkeys'], function (result) {
            that.hotkeys = result.hotkeys || {};
            that.setup.apply(that);
        });
    };
    this.setConfigMode = function (enabled) {
        this.configMode = enabled;
        document.body.classList.toggle('config-mode', enabled);
    };
    this.toggleConfigMode = function () {
        this.setConfigMode(!this.configMode)
    };
    this.init();
};
let newTab = null;

window.addEventListener('load', function () {
    newTab = new NewTab();
});
