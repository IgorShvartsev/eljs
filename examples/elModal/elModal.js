import {default as el} from './../../el.js';

/**
 * requires animate.css ver 3.x.x <https://animate.style>
 */
export default ((eee) => {
    function init(selector, options) {
        return new Modal(selector, options);
    }

    class Modal {
        settings = {};
        $modalLauncherBtn;
        $target;
        targetSelector;
        $closeBtn;
        $html;
        /**
         * First modal container with html content should be created in HTML something like <div id="modal">....</div>
         * Next exucute in script uniModal.init(selector, options) 
         * 
         * @param {string} selector <a href="#modal"> 
         *          OR <button data-modal-selector="modal"> 
         *          OR just selector of <div id="modal">....</div>. Using last one allows to launch() only 
         * @param {object} options 
         */
        constructor (selector, options) {
            const defaults = {
                position: 'fixed', 
                width: '100%', 
                height: '100%', 
                top: '0px', 
                left: '0px', 
                zIndexIn: '9998',  
                zIndexOut: '-9999',  
                color: '#efefef', 
                opacityIn: '1',  
                opacityOut: '0', 
                animatedIn: 'zoomIn',
                animatedOut: 'zoomOut',
                animationDuration: '.6s', 
                overflow: 'auto', 
                beforeOpen: function() {},           
                afterOpen: function() {}, 
                beforeClose: function() {}, 
                afterClose: function() {}
            }

            this.settings = {...defaults, ...options};
            this.$modalLauncherBtn = eee.q(selector);
            if (!this.$modalLauncherBtn.length()) {
                console.log('Selector is not valid. No elements found');
                return;
            }
            this.targetSelector = this.$modalLauncherBtn.getAttr('href').replace('#', '');
            if (!this.targetSelector) {
                this.targetSelector = this.$modalLauncherBtn.data('modalSelector')
            }
            if (this.targetSelector) {
                this.$target = eee.q('#' + this.targetSelector);
            } else {
                this.targetSelector = selector;
                this.$target = eee.q(selector);
                if (!this.$target.length()) {
                    console.log('Selector is not valid. Modal container not found');
                    return;
                }
            }

            this.$target.addClass('animated').addClass(this.targetSelector + '-off');
            this.$closeBtn = this.$target.find('.close-' + this.targetSelector).addAttr('title', 'Close');
            this.$html = eee.q('body, html');

            this.#initStyles();
            this.#initEvents();
        }

        launch() {
            if (!this.$target.length()) {
                console.log('Unable to lunch modal view because of wrong selector');
                return;
            }
            this.#openModal();
        }

        #initStyles() {
            const styles = {
                position: this.settings.position,
                width: this.settings.width,
                height: this.settings.height,
                top: this.settings.top,
                left: this.settings.left,
                'background-color': this.settings.color,
                'overflow-y': this.settings.overflow,
                'z-index': this.settings.zIndexOut,
                opacity: this.settings.opacityOut,
                'animation-duration': this.settings.animationDuration
            };
            this.$target.css(styles);
        }

        #initEvents()
        {
            const self = this;

            !this.$modalLauncherBtn 
            || !this.$modalLauncherBtn.length() 
            || this.$modalLauncherBtn.event('click', function (e) {
                e.preventDefault();
                self.#openModal();
            });

            !this.$closeBtn.length() 
            || this.$closeBtn.event('click', function (e) {
                e.preventDefault();
                self.$html.css({overflow: 'auto'});
                self.settings.beforeClose.call(this);

                if (self.$target.hasClass(self.targetSelector + '-on')) {
                    self.$target
                        .removeClass(self.targetSelector + '-on')
                        .addClass(self.targetSelector + '-off');
                } 
    
                if (self.$target.hasClass(self.targetSelector + '-off')) {
                    self.$target
                        .removeClass(self.settings.animatedIn)
                        .addClass(self.settings.animatedOut)
                        .event(
                            'animationend', 
                            function (e) {
                                self.$modalLauncherBtn.css({'z-index': self.settings.zIndexOut});
                                self.settings.afterClose.call(this, e);
                            }, 
                            {once: true}
                        );
                };
    
            });
        }

        #openModal() {
            const self = this;
            this.$html.css({overflow: 'hidden'});
                
            if (this.$target.hasClass(this.targetSelector + '-off')) {
                this.$target.removeClass(this.settings.animatedOut)
                    .removeClass(this.targetSelector + '-off')
                    .addClass(this.targetSelector + '-on');
            } 

            if (this.$target.hasClass(this.targetSelector + '-on')) {
                this.settings.beforeOpen.call(this);
                this.$target
                    .css({opacity: this.settings.opacityIn, 'z-index': this.settings.zIndexIn})
                    .addClass(this.settings.animatedIn)  
                    .event(
                        'animationend', 
                        function (e) {
                            self.settings.afterOpen.call(this, e);
                        }, 
                        {once: true}
                    );
            };  
        }
    }

    return {init};
})(el);       
