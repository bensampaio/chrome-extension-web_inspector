const wi = {

	css: {
		ELEMENT: 'chrome-extension-wi-element',
		COLOR_SELECT_CLASS: 'chrome-extension-wi-color_select',
		CLOSE_BUTTON_CLASS: 'chrome-extension-wi-close_button',
		CONTENT_BOX_CLASS: 'chrome-extension-wi-content_box',
		DATA_BOX_CLASS: 'chrome-extension-wi-data_box',
		DATA_FIELD: 'chrome-extension-wi-data_field',
		FILLER_BOX_CLASS: 'chrome-extension-wi-filler_box',
	},
	
	current: {
		active: false,
		contentBox: $(),
		element: $(),
		elements: $(),

		addElements(newElements) {
			if (newElements.length > 0) {
				newElements.addClass(wi.css.ELEMENT).on('click', wi.events.elementClick);
				this.elements = this.elements.add(newElements);
			}
		},

		resetElements() {
			this.elements.removeClass(wi.css.ELEMENT).off('click', wi.events.elementClick);
			this.elements = $();
		},

		toggleStatus() {
			const elementsLogic = wi.elements;
			let toggleEvent = '';

			// Change Application Status
			this.active = !this.active;

			if (this.active) {
				toggleEvent = 'on';
				this.addElements($(elementsLogic.selector).filter(elementsLogic.filter));
			}
			else {
				toggleEvent = 'off';
				this.resetElements();
				wi.box.remove();
			}

			// Remove Data Box when user clicks outside
			$(document)
				[toggleEvent]('click', wi.events.documentClicked)
				[toggleEvent]('DOMNodeInserted', wi.events.elementCreated);

			// Move Data Box on scroll
			$(window)
				[toggleEvent]('keydown', wi.events.keyPress)
				[toggleEvent]('resize scroll', wi.events.windowResizeOrScroll);
		},
	},

	elements: {
		selector: '',
		containers: '',
		filter: '',

		CONTENT: [ 'ARTICLE', 'ASIDE', 'DIV', 'FIELDSET', 'FOOTER', 'FORM', 'HEADER', 'MAIN', 'NAV', 'OL', 'SECTION', 'TABLE', 'UL' ],
		FORM: [ 'BUTTON', 'INPUT', 'KEYGEN', 'OUTPUT', 'SELECT', 'TEXTAREA' ],
		GAME: [ 'CANVAS' ],
		MULTIMEDIA: [ 'AUDIO', 'IMG', 'VIDEO' ],
		REFERENCE: [ 'A', 'IFRAME', 'EMBED', 'OBJECT' ],
		TEXT: [ 
			'ABBR', 'ADDRESS', 
			'B', 'BDI', 'BDO', 'BLOCKQUOTE', 
			'CAPTION', 'CITE', 'CODE', 
			'DD', 'DEL', 'DIV', 'DFN', 'DIALOG', 'DT', 
			'EM', 
			'FIGCAPTION', 
			'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
			'I', 'INS', 
			'LABEL', 'LEGEND', 'LI', 
			'MARK',
			'P', 'PRE',
			'Q',
			'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUMMARY', 'SUP',
			'TIME', 'TH', 'TD',
			'U',
			'VAR'
		],

		init() {
			this.selector = this.REFERENCE.join(',') + ',' + this.TEXT.join(',') + ',' + this.MULTIMEDIA.join(',');
			this.containers = this.CONTENT.join(',');
			this.filter = ':not(:has(' + this.containers + '))';
		},
	},

	events: {

		documentClicked(event) {
			if (wi.current.active) {
				wi.box.remove();
			}
		},

		elementCreated(event) {
			if (wi.current.active) {
				const domCreated = $(event.target);
				const elementsLogic = wi.elements;

				if (!domCreated.hasClass(wi.css.CONTENT_BOX_CLASS)) {
					let newElements = domCreated.find(elementsLogic.selector).filter(elementsLogic.filter).filter(':not(.' + wi.css.ELEMENT + ')');

					// If the created DOM is a inspectable element and doesn't contain any containers
					if (!domCreated.hasClass(wi.css.ELEMENT) && domCreated.is(elementsLogic.selector) && domCreated.find(elementsLogic.containers).length == 0) {
						newElements = newElements.add(domCreated);
					}

					// Add new Elements to Current Elements List
					wi.current.addElements(newElements);
				}
			}
		},

		elementClick(event) {
			if (wi.current.active) {
				event.preventDefault();
				event.stopPropagation();

				// Remove existing box
				wi.box.remove();

				// Add new box
				wi.box.add($(event.target));
			}
		},

		keyPress(event) {
			console.log(event.keyCode);
			if (wi.current.active) {

				// If 'ESC' is pressed send request to the background page
				if (event.keyCode == 27) {
					chrome.extension.sendRequest({ action: 'toggleIcon' });
				}
			}
		},

		windowResizeOrScroll(event) {
			if (wi.current.active && wi.current.contentBox.length > 0 && wi.current.element.length > 0) {
				wi.box.setStyles(wi.current.contentBox, wi.current.element);
			}
		},

	},

	box: {

		add(elementToInspect) {
			const contentBox = $('<div class="' + wi.css.CONTENT_BOX_CLASS + '"></div>');
			const dataBox = $('<div class="' + wi.css.DATA_BOX_CLASS + '"></div>');
			const fillerBox = $('<div class="' + wi.css.FILLER_BOX_CLASS + '"></div>');
			const closeButton = $('<div class="' + wi.css.CLOSE_BUTTON_CLASS + '">X</div>');

			// Get Element Metadata
			const metadata = this.getMetadata(elementToInspect);

			// Set Data Box Content
			let htmlMetadata = '<form>';

			for(let i = 0; i < metadata.length; i++) {
				const field = metadata[i];

				if (field.value) {
					htmlMetadata+= 
						`<div class="${wi.css.DATA_FIELD}">
							<label for="${field.id}">${field.label}:</label>` +
							(field.id.indexOf('src') != -1 ?
								`<a href="${field.value}" target="_blank">${field.value}</a>` :
								`<span>${field.value}</span>`
							) +
							(field.id.indexOf('color') != -1?
								`<select class="${wi.css.COLOR_SELECT_CLASS}">
									<option value="hex">HEX</option>
									<option value="rgb" selected>RGB</option>
								</select>` :
								''
							) +
						'</div>';
				}
			}

			htmlMetadata+= '<form>';

			// Set Content Box Events
			contentBox
				.on('click', (event) => {
					event.stopPropagation();
				})
				.on('change', 'select.' + wi.css.COLOR_SELECT_CLASS, (event) => {
					const $select = $(event.currentTarget);
					const $field = $select.prev();

					const colorType = $select.val();
					const rgbValue = $field.data('rgb') || $field.text();
					const hexValue = $field.data('hex') || wi.utils.colors.rgb2hex(rgbValue);

					// Set values
					$field.data({ rgb: rgbValue, hex: hexValue });

					switch(colorType) {
						case 'rgb':
							$field.text(rgbValue);
						break;

						case 'hex':
							$field.text(hexValue)
						break;
					}
				});

			closeButton.on('click', wi.events.documentClicked);

			// Add Data Box to the Content Box
			dataBox.append(htmlMetadata);
			contentBox.append(closeButton);
			contentBox.append(dataBox);
			contentBox.append(fillerBox);

			// Add Content Box to Document
			$('body').append(contentBox);

			// Set Content Box Styles
			this.setStyles(contentBox, elementToInspect);

			wi.current.contentBox = contentBox;
			wi.current.element = elementToInspect;
		},

		getMetadata(elementToInspect) {
			const textMetadata = [];
			const refMetadata = [];
			const multimediaMetadata = [];

			const tagName = elementToInspect[0].tagName;
			const text = elementToInspect.text();
			const textColor = wi.utils.parseColor(elementToInspect.css('color'));
			const backgroundColor = wi.utils.parseColor(elementToInspect.css('background-color'));
			const backgroundImage = wi.utils.parseBackgroundImage(elementToInspect.css('background-image'));
			const href = wi.utils.parseSourceURL(elementToInspect.attr('href'));
			const source = wi.utils.parseSourceURL(elementToInspect.attr('src') || elementToInspect.children('source').attr('src'));

			// Set Text Metadata
			if (text && typeof text === 'string') {
				textMetadata.push(
					{ id: 'font', label: chrome.i18n.getMessage('fieldFontLabel'), value: elementToInspect.css('font-family') },
					{ id: 'fsize', label: chrome.i18n.getMessage('fieldFSizeLabel'), value: elementToInspect.css('font-size') },
					{ id: 'text-color', label: chrome.i18n.getMessage('fieldTextColorLabel'), value: textColor },
					{ id: 'background-color', label: chrome.i18n.getMessage('fieldBackgroundColorLabel'), value: backgroundColor },
				);
			}

			// Set Reference Metadata
			if (wi.elements.REFERENCE.includes(tagName)) {
				refMetadata.push(
					{ id: 'src', label: chrome.i18n.getMessage('fieldSourceLabel'), value: href || source },
					{ id: 'lang', label: chrome.i18n.getMessage('fieldLangLabel'), value: elementToInspect.attr('hreflang') },
				);
			}

			// Set Multimedia Metadata
			if (wi.elements.MULTIMEDIA.includes(tagName) || backgroundImage) {
				multimediaMetadata.push(
					{ id: 'width', label: chrome.i18n.getMessage('fieldWidthLabel'), value: elementToInspect.width() + 'px' },
					{ id: 'height', label: chrome.i18n.getMessage('fieldHeightLabel'), value: elementToInspect.height() + 'px' },
					{ id: 'src', label: chrome.i18n.getMessage('fieldSourceLabel'), value: source },
					{ id: 'desc', label: chrome.i18n.getMessage('fieldDescLabel'), value: elementToInspect.attr('alt') },
					{ id: 'image-src', label: chrome.i18n.getMessage('fieldBackgroundImageLabel'), value: backgroundImage },
				);
			}

			return [
				...textMetadata,
				...refMetadata,
				...multimediaMetadata,
			];
		},

		setStyles(contentBox, elementToInspect) {
			const dataBox = contentBox.children('.'+wi.css.DATA_BOX_CLASS);
			const fillerBox = contentBox.children('.'+wi.css.FILLER_BOX_CLASS);
			const closeButton = contentBox.children('.'+wi.css.CLOSE_BUTTON_CLASS);

			const documentHeight = $(document).outerHeight();

			const windowWidth = $(window).outerWidth();
			const windowHeight = $(window).outerHeight();

			const elementWidth = elementToInspect.outerWidth();
			const elementHeight = elementToInspect.outerHeight();

			let boxWidth = parseInt(contentBox.css('min-width'), 10);
			boxWidth = (elementWidth > boxWidth ? elementWidth : boxWidth);
			const boxBorder = parseInt(contentBox.css('border-width'), 10);

			// Set Content Box Width
			contentBox.css('width', boxWidth);

			const boxHeight = elementHeight + contentBox.height();

			const elementPosition = elementToInspect.offset();
			const boxPosition = {
				top: elementPosition.top - boxBorder,
				left: elementPosition.left - boxBorder,
				right: elementPosition.left + boxWidth + boxBorder,
				bottom: elementPosition.top + boxHeight + boxBorder
			};

			const contentBoxStyles = {};
			const dataBoxStyles = {};
			const fillerBoxStyles = {};

			// Set Horizontal Position
			if (boxPosition.right > windowWidth) {
				contentBoxStyles.left = 'initial';
				contentBoxStyles.right = windowWidth - (elementPosition.left + elementWidth + boxBorder);

				fillerBoxStyles.left = 0;
				fillerBoxStyles.right = 'initial';

				closeButton.addClass('top left');
			}
			else {
				contentBoxStyles.left = boxPosition.left;
				contentBoxStyles.right = 'initial';

				fillerBoxStyles.left = 'initial';
				fillerBoxStyles.right = 0;

				closeButton.addClass('top right');
			}

			// Set Vertical Position
			if (boxPosition.bottom > documentHeight) {
				contentBoxStyles.top = 'initial';
				contentBoxStyles.bottom = windowHeight - (elementPosition.top + elementHeight + boxBorder);

				dataBoxStyles.paddingTop = 0;
				dataBoxStyles.paddingBottom = boxBorder / 2;
				dataBoxStyles.marginTop = 0;
				dataBoxStyles.marginBottom = elementHeight;

				fillerBoxStyles.top = 'initial';
				fillerBoxStyles.bottom = 0;
			}
			else {
				contentBoxStyles.top = boxPosition.top;
				contentBoxStyles.bottom = 'initial';

				dataBoxStyles.paddingTop = boxBorder / 2;
				dataBoxStyles.paddingBottom = 0;
				dataBoxStyles.marginTop = elementHeight;
				dataBoxStyles.marginBottom = 0;

				fillerBoxStyles.top = 0;
				fillerBoxStyles.bottom = 'initial';
			}

			// Set Filler Box Width and Height
			if (boxWidth > elementWidth) {
				fillerBoxStyles.width = boxWidth - elementWidth;
				fillerBoxStyles.height = elementHeight;
				fillerBoxStyles.display = 'block';
			}
			else {
				fillerBoxStyles.display = 'none';
			}

			fillerBox.css(fillerBoxStyles);
			dataBox.css(dataBoxStyles);
			contentBox.css(contentBoxStyles);
		},


		remove() {
			wi.current.contentBox.remove();
			wi.current.element = $();
		},

	},

	utils: {

		colors: {
			rgbRegex: /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/,
			hexDigits: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'],

			isRgb(color) {
				return rgb.match(this.rgbRegex).length === 4;
			},

			rgb2hex(rgb) {
				rgb = rgb.match(this.rgbRegex);
				return '#' + this.hex(rgb[1]) + this.hex(rgb[2]) + this.hex(rgb[3]);
			},

			hex(x) {
				return isNaN(x) ? '00' : this.hexDigits[(x - x % 16) / 16] + this.hexDigits[x % 16];
			},
		},

		parseColor(str) {
			return str == 'transparent' ? '' : str;
		},

		parseBackgroundImage(str) {
			return str.substr(0,3) == 'url' ? this.parseSourceURL(str.replace('url(','').replace(')','')) : '';
		},

		parseSourceURL(str) {
			if (str && str.indexOf('://') == -1) {
				str = window.location.protocol + '//' + window.location.host + (window.location.port ? ':' + window.location.port : '' ) + (str.charAt(0) == '/' ? '' : '/') + str;
			}

			return str;
		},

	}

};

wi.elements.init();