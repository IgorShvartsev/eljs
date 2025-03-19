
export default (() => {
    const buildInMouseEventTypes = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup'];
    const buildInEventTypes = ['abort', 'afterprint', 'beforeprint', 'beforeunload', 'canplay', 'canplaythrough', 'change', 'ended', 'error', 'fullscreenchange', 'fullscreenerror', 'input', 'invalid', 'load', 'loadeddata', 'loadedmetadata', 'message', 'offline', 'online', 'open', 'pause', 'play', 'playing', 'progress', 'ratechange', 'resize', 'reset', 'scroll', 'search', 'seeked', 'seeking', 'select', 'show', 'stalled', 'submit', 'suspend', 'timeupdate', 'toggle', 'unload', 'waiting', 'volumechange'];
    const buildInFocusEventTypes = ['onblur', 'onfocus', 'onfocusin', 'onfocusout'];
    const buildInDragEventTypes = ['ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop'];
    const buildInInputEventTypes = ['oninput'];
    const buildInKeyboardEventTypes = ['onkeydown', 'onkeypress', 'onkeyup'];
    const buildInAnimationEventTypes = ['animationend', 'animationiteration', 'animationstart'];

    const create = (tag) => new ElementCollection(document.createElement(tag));

    const fromHtml = (html) => new ElementCollection((new DOMParser()).parseFromString(html, 'text/html').body.firstChild);
    
    const q = (selector) => new ElementCollection(
        selector instanceof Element 
            ? selector 
            : (selector instanceof HTMLCollection ? [...selector] : [...document.querySelectorAll(selector)])
    );

    class ElementCollection {
        #el = [];
        
        constructor(el) {
            this.#el = Array.isArray(el) ? el : [el];
        }

        get el() {
            return this.#el;
        }

        eq(index) {
            return new ElementCollection(this.#el[index] ?? []);
        }

        get(index = 0) {
            return this.#el[index] ?? null;
        }

        length() {
            return this.#el.length;
        }

        add(selector) {
            let collection = []
            if (!Array.isArray(selector)) {
                selector = [selector];
            }
            selector.forEach(element => {
                if (element instanceof Element ) {
                    collection.push(element);
                } else {
                    collection = [...collection, ...document.querySelectorAll(selector)];
                }
            });
            return new ElementCollection([...new Set([...this.#el, ...collection])]);
        }

        not(selector) {
            let sourceCollection = [];
            if (!Array.isArray(selector)) {
                selector = [selector];
            }
            selector.forEach((el) => {
                if (el instanceof Element) {
                    sourceCollection.push(el);
                } else {
                    sourceCollection.push(...document.querySelectorAll(el));
                }
            });
            const collection = this.#el.filter((element) => !sourceCollection.includes(element));
            return new ElementCollection([...new Set(collection)]);
        }

        addAttr(attr, v) {
            this.#handleCollection((el) => {
                attr = this.#makeAssoc(attr, v)
                for (const [key, v] of Object.entries(attr)) {
                    el.setAttribute(key, v);
                }
            })
            return this;
        }

        removeAttr (attr) {
            this.#handleCollection((el) => el.removeAttribute(attr));
            return this;
        }

        getAttr(attr) {
            return this.#el.length && this.#el[0].hasAttribute(attr) ? this.#el[0].getAttribute(attr) : '';
        }

        addClass(...className) {
            this.#handleCollection((el) => el.classList.add(...className));
            return this;
        }

        removeClass(...className) {
            this.#handleCollection((el) => el.classList.remove(...className));
            return this;
        }

        hasClass(className) {
            return this.#el.length ? this.#el[0].classList.contains(className) : false;
        }

        css(name, v) {
            if (typeof v === 'undefined' && typeof name === 'string') {
                let result = '';
                if (this.#el.length) {
                    let compStyle = window.getComputedStyle(this.#el[0]);
                    result = compStyle.getPropertyValue(name);
                }
                return result;
            }
            this.#handleCollection((el) => {
                name = this.#makeAssoc(name, v)
                for (const [key, v] of Object.entries(name)) {
                    el.style.setProperty(key, v);
                }
            });
            return this;
        }

        append(element) {
            this.#attachCommand('append', element);
            return this;
        }

        appendTo(element) {
            this.#attachToCommand('append', element);
            return this;
        }

        prepend(element) {
            this.#attachCommand('prepend', element);
            return this;
        }

        prependTo(element) {
            this.#attachToCommand('prepend', element);
            return this;
        }

        after(element) {
            this.#attachCommand('after', element);
            return this;
        }

        before(element) {
            this.#attachCommand('before', element);
            return this;
        }

        children(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let children = [...el.children].filter(child => !selector || child.matches(selector));
                if (children.length) {
                    collection.push(...children);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        closest(selector) {
            const collection = this.#el.map(el => el.closest(selector));
            return new ElementCollection([...new Set(collection)]);
        }

        parent() {
            const collection = this.#el.map(el => el.parentElement);
            return new ElementCollection([...new Set(collection)]);
        }

        siblings(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let siblings = [...el.parentNode.children].filter(sibling => sibling !== el && (!selector || sibling.matches(selector)));
                if (siblings.length) {
                    collection.push(...siblings);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        match(selector) {
            let result = false;
            this.#handleCollection((el) => {
                if (result) {
                    return;
                }
                result = el.matches(selector)
            });
            return result;
        }

        first() {
            return new ElementCollection(this.#el.length ? this.#el[0] : []);
        }

        last() {
            return new ElementCollection(this.#el.length ? this.#el[this.#el.length - 1] : []);
        }

        prevUntil(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                el = el.previousElementSibling;
                while (el && (!selector || !el.matches(selector))) {
                    collection.push(el);
                    el = el.previousElementSibling;
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        prev() {
            let collection = [];
            this.#handleCollection((el) => {
                el = el.previousElementSibling;
                if (el) {
                    collection.push(el);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        next() {
            let collection = [];
            this.#handleCollection((el) => {
                el = el.nextElementSibling;
                if (el) {
                    collection.push(el);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        find(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let foundEls = [...el.querySelectorAll(selector)];
                if (foundEls.length) {
                    collection.push(...foundEls);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        filter(cb) {
            return new ElementCollection(typeof cb === 'function' ? this.#el.filter(cb) : []);
        }

        each(cb) {
            if (typeof cb === 'function') {
                this.#el.forEach((el, index) => cb.call(el, el, index));
            }
            return this;
        }

        html(content) {
            if (typeof content === 'undefined') {
                return this.#el.length ? this.#el[0].innerHTML : '';
            }
            this.#handleCollection((el) => el.innerHTML = content);
            return this;
        }

        text(content) {
            if (typeof content === 'undefined') {
                return this.#el.length ? this.#el[0].textContent : '';
            }
            if (content) {            
                this.#handleCollection((el) => el.textContent = content);
            }
            return this;
        }

        data(name, value) {
            if (typeof value === 'undefined') {
                let result = '';
                if (this.#el.length) {
                    try {
                        result = JSON.parse(this.#el[0].dataset[name]);
                    } catch(error) {
                        result = this.#el[0].dataset[name] ?? '';
                    }
                }
                return result;
            }
            this.#handleCollection((el) => {
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                el.dataset[name] = value;
            });
            return this;
        }

        remove() {
            this.#handleCollection((el) => el.remove());
            return this;
        }

        empty () {
            this.#handleCollection((el) => el.replaceChildren());
            return this;
        }

        hide() {
            this.#handleCollection((el) => el.style.display = 'none');
            return this;
        }

        show() {
            this.#handleCollection((el) => el.style.display = '');
            return this;
        }

        isVisible() {
            return this.#el.length 
                ? this.#el[0].checkVisibility({
                    opacityProperty: true,
                    visibilityProperty: true,
                })
                : false;
        }

        childIndex() {
            return this.#el.length && this.#el[0].parentNode 
                ? [...this.#el[0].parentNode.children].indexOf(this.#el[0])
                : -1;
        }

        prop(name) {
            if (!this.#el.length) {
                return null;
            }
            const el = this.#el[0];
            if (name in el) {
                return typeof el[name] !== 'function' ? el[name] : null;
            }
            const compStyle = window.getComputedStyle(el);
            const result = compStyle.getPropertyValue(name);
            const matches = result.match(/^([0-9.]+)/);
            return matches ? (matches[1] * 1) : result;
        }

        offset() {
            const result = {top: 0, left: 0};
            if (this.#el.length) {  
                const {top, left} = this.#el[0].getBoundingClientRect();
                result.top = top + window.scrollY;
                result.left = left + window.scrollX; 
            }
            return result;
        }

        position() {
            const result = {top: 0, left: 0};
            if (this.#el.length) {
                const {marginTop, marginLeft} = window.getComputedStyle(this.#el[0])                
                const {top, left} = this.#el[0].getBoundingClientRect();
                result.top = top - parseFloat(marginTop);
                result.left = left - parseFloat(marginLeft);
            }
            return result;
        }

        event(type, cb, option) {
            this.#handleCollection((el) => {
                if (typeof cb === 'function') {
                    el.addEventListener(type, cb, typeof option === 'boolean' || typeof option === 'object' ? option : false);
                }
            });
            return this;
        }

        on(type, selector, cb, option) {
            this.#handleCollection((el) => {
                if (typeof cb === 'function') {
                    let target = selector;
                    el.addEventListener(
                        type,
                        (e) => {
                            const closest = e.target.closest(target);
                            if (closest && el.contains(closest)) {
                                cb.call(closest, e);
                            }
                        },
                        typeof option === 'boolean' || typeof option === 'object' ? option : false
                    );
                }
            });
            return this;
        }

        trigger(type, options) {
            this.#handleCollection((el) => {
                let event;
                let defaultOptions = {bubbles: true};
                if (typeof options !== 'object') {
                    options = {};
                }
                options = {...defaultOptions, ...options};
                if (buildInMouseEventTypes.includes(type)) {
                    event = new MouseEvent(type, options);
                } else if (buildInEventTypes.includes(type)) {
                    event= new Event(type, options);
                } else if (buildInFocusEventTypes.includes(type)) {
                    event= new FocusEvent(type, options);
                } else if (buildInDragEventTypes.includes(type)) {
                    event= new DragEvent(type, options);
                } else if (buildInInputEventTypes.includes(type)) {
                    event= new InputEvent(type, options);
                } else if (buildInKeyboardEventTypes.includes(type)) {
                    event= new KeyboardEvent(type, options);
                } else if (buildInAnimationEventTypes.includes(type)) {
                    event= new AnimationEvent(type, options);
                } else {
                    event= new CustomEvent(type, options);
                }
                el.dispatchEvent(event);
            });
            return this;
        }

        shadowView(htmlContent) {
            if (this.#el.length) {
                this.#el[0].attachShadow({mode: 'open'});
                this.#el[0].shadowRoot.innerHTML = htmlContent;
            } 
            return this;
        }

        #makeAssoc(key, v) {
            let temp;
            if (typeof key !== 'object') {
                temp = key;
                key = {};
                key[temp] = v;
            }
            return key;
        }

        #handleCollection(cb) {
            [].forEach.call(this.#el, cb);
        }

        #attachCommand(command, element) {
            this.#handleCollection((el) => {
                element = element instanceof ElementCollection ? element.el : [element];
                element.forEach((item) => el[command](item));
            });
        }

        #attachToCommand(command, element) {
            this.#handleCollection((el) => {
                element = element instanceof ElementCollection ? element.el : [element];
                element.forEach((item) => item[command](el));
            });
        }
    }

    return {create, fromHtml, q};
})();
