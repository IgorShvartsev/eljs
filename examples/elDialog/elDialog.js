import {default as el} from './../../el.js';

export default ((eee) => {
    const closeBkg = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABBUlEQVR4nO3ZTQqDMBAF4HeKPOkV2+MWbE9jKXUhRcQk8xeZt3Il8xFNZgiQyWQyV8odwORdBH41fGtpygPAAmB2xkxrDctaU3UKgOf6gjeAG+zDTQ2vnho8MZRCeGIojfDAUAthiaE2wgJjhtDEmCM0MG4ISYw7QgITBtGDCYdowYRF1GDCI85ghkEcYYZD7M0Q899zhEGteWWGW4lttp+T53DWlUt8Wtz5sSOMzVU52p2GwfDEFhsew4pzIiyGDYddOAw7TuwwGAq0He4YCvZObhgqNIDmGCp2sWYYi1a8aGMs54mihfEYioo0xnOyK1KYCONpkcBc5urtMpehmUwmg3D5AAklyc9YEtl/AAAAAElFTkSuQmCC) center center no-repeat';

    const init = (options, callback) => new Dialog(options, callback);

    class Dialog {
        settings = {
            name: 'default',
            title: 'Dialog',
            submitButtonText: ' Submit ',
            cancelButtonText: ' Cancel ',
            formHtml: '',
            useForm: false,
            destroyOnClose: true,
            showCancelButton: true,
            showSubmitButton: true,
            showDialogFooter: true,
            css: {
                width: '50%',
                transform: 'translate(0,0)',
            },
            cssContent: {
                outline: 0,
                overflow: 'hidden',
                position: 'relative',
                'background-color': '#fff',
                border: '1px solid rgba(0,0,0,0.2)',
                'border-radius': '6px',
                'box-shadow': '0 3px 9px rgba(0,0,0,0.5)',
                'background-clip': 'padding-box',
            },
            cssHeader: {
                padding: '15px',
                'border-bottom': '1px solid #E5E5E5',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
            },
            cssFooter: {
                padding: '15px',
                'border-top': '1px solid #e5e5e5',
                display: 'flex',
                'justify-content': 'flex-end',
            },
            cssClose: {
                padding: '0',
                cursor: 'pointer',
                background: closeBkg,
                border: '0',
                color: '#000',
                width: '25px',
                height: '25px',
            },
            cssBody: {
                'text-align': 'left',
                'max-height': '640px',
                padding: '15px',
            },
            cssButton: {
                'margin-left': '8px',
            },
        };
        $container;
        $overlay;
        $dlg;

        constructor(options, callback) {
            this.settings = {...this.settings, ...options};
            this.build(callback);
        };

        build(callback) {
            let $form;
            let $dialogContent;
            let $dialogHeader;
            let $dialogBody;
            let $dialogFooter;
            let $buttonClose;
            let $actionButtons;
            const self = this;
    
            this.$overlay = eee.create('div')
                .addAttr('id', this.settings.name + '-overlay')
                .css({
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    'z-index': 1030,
                    'background-color': '#000',
                    display: 'none',
                    opacity: 0.7,
                })
                .appendTo(eee.q('body'));
    
            this.$container = eee.create('div')
                .addAttr('id', this.settings.name + '-container')
                .addClass('dialog-container')
                .css({
                    display: 'none',
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    'z-index': 1500,
                    'overflow-x': 'hidden',
                    'overflow-y': 'auto',
                    'box-sizing': 'border-box',
                    'text-align': 'center',
                    'background-color': 'rgb(0, 0, 0, 0.4)',
                })
                .appendTo(eee.q('body'));
    
            this.$dlg = eee.create('div')
                .addAttr('id', self.settings.name + '-dlg')
                .addClass('dialog-modal')
                .css({...this.settings.css, ...{
                    opacity: 1.0,
                    display: 'inline-block',
                    position: 'relative',
                    padding: 0,
                    'vertical-align': 'middle',
                    visibility: 'visible',
                    'box-sizing': 'border-box',
                }})
                .appendTo(this.$container);

    
            $dialogContent = eee.create('div')
                . addClass('dialog-content')
                .css({...this.settings.cssContent, ...{
                    'box-sizing': 'border-box',
                }})
                .appendTo(this.$dlg);   
    
            if (this.settings.useForm) {
                $form = eee.create('form')
                    .addClass('dialog-form')
                    .appendTo($dialogContent)
                    .event('submit', function (e) {
                        if (typeof callback === 'function') {   
                            return callback.call(this, e);
                        }
                        console.log('Callback is not defined');
                        return false;
                    });
            } else {
                $form = eee.create('div')
                    .addClass('dialog-wrapper')
                    .appendTo($dialogContent);
            }
    
            $dialogHeader = eee.create('div')
                .css(this.settings.cssHeader)
                .addClass('dialog-header')
                .appendTo($form); 
    
            $dialogBody = eee.create('div')
                .addClass('dialog-body')
                .css({...self.settings.cssBody, ...{
                    'box-sizing': 'border-box',
                }})
                .appendTo($form);
            
            if (this.settings.useForm) {
                $dialogBody.html('<div class="formcontent">' + this.settings.formHtml + '</div>');
            } else {
                $dialogBody.html(this.settings.formHtml);
            }
    
            $dialogFooter = eee.create('div')
                .addClass('dialog-footer')
                .css({...this.settings.cssFooter, ...{
                    'box-sizing': 'border-box',
                }})
                .appendTo($form);
            
            eee.create('h4')
            .addClass('modal-title')
            .appendTo($dialogHeader)
            .text(self.settings.title);
    
            $buttonClose = eee.create('button')
                .css(this.settings.cssClose)
                .addClass('close')
                .addAttr('type', 'button')
                .addAttr('data-dismiss', 'modal')
                .addAttr('aria-label', 'Close')
                .appendTo($dialogHeader)
                .event('click', function () {
                    self.settings.destroyOnClose ? self.destroy() : self.hide();
                    return false;
                });
    
            eee.create('span')
                .addClass('suitepicon','suitepicon-action-clear')
                .appendTo($buttonClose)
                .event('click', function () {
                    self.settings.destroyOnClose ? self.destroy() : self.hide();
                    return false;
                });
    
           $actionButtons = eee.create('div')
               .addClass('action_buttons')
               .appendTo($dialogFooter);
               
            if (self.settings.showCancelButton) {
                eee.create('input')
                    .addAttr('type', 'button')
                    .addAttr('name', 'cancel')
                    .addClass('button')
                    .css(this.settings.cssButton)
                    .addAttr('value', self.settings.cancelButtonText)
                    .appendTo($actionButtons)
                    .event('click', function () {
                        $dialogHeader.find('.close').get().click();
                    });
            }   
    
            if (self.settings.showSubmitButton) {
                eee.create('input')
                    .addAttr('type', 'submit')
                    .addAttr('name', 'submit')
                    .addClass('button')
                    .css(this.settings.cssButton)
                    .addAttr('value', self.settings.submitButtonText)
                    .appendTo($actionButtons);
            }
    
            if (!self.settings.showDialogFooter) {
                $dialogFooter.hide();
            }
    
            if (!this.settings.useForm && typeof callback === 'function') {
                callback.call($form.get());
            }
        }
        
        form(html) {
            this.$dlg.find('.formcontent').empty().html(html);
            return this;
        }

        addElementToForm($el) {
            this.$dlg.find('.formcontent').append($el);
            return this;
        }

        launcher(selector, callback) {
            const self = this;
            eee.q(selector).event('click', function () {
                if (typeof callback === 'function') {
                    callback.call(this, self.$dlg);
                }
                self.show();
                return false;
            });
            return this;
        }

        show() {
            this.$overlay.show();
            this.$container.show();
            return this;
        }

        hide() {
            this.$container.hide();
            this.$overlay.hide();
            return this;
        }

        showLoader() {
            const $loader = eee.create('div')
                .addClass('dialog-loader')
                .css({
                    width: '64px',
                    height: '64px',
                    position: 'absolute',
                    'z-index': 101,
                })
                .appendTo(this.$dlg);

            eee.create('div')
                .addClass('loader-overlay')
                .css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    'z-index': 100,
                    background: '#000',
                    opacity: 0.7,
                })
                .appendTo(this.$dlg);
               
            $loader
                .css('top', ((this.$dlg.prop('height') - $loader.prop('height')) / 2) + 'px')
                .css('left', ((this.$dlg.prop('width') - $loader.prop('width')) / 2) + 'px');
        }

        hideLoader() {
            this.$dlg.find('.dialog-loader').remove();
            this.$dlg.find('.loader-overlay').remove();
        }

        destroy() {
            this.$container.remove();
            this.$overlay.remove();
            delete this.settings;
            this.$dlg.remove();
            this.$overlay.remove();
            this.$container.remove();
        }
    }

    return {init};
})(el);
