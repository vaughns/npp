function pySetupEditorProxy(syntax) {
	var e = Npp.editor;
	var r = emmet.require;

	editorProxy._syntax = syntax;
	var indentation = '\t';
	if (!e.getUseTabs()) {
		indentation = r('utils').repeatString(' ', +e.getIndent());
	}

	var nl = '\n';
	switch(+e.getEOLMode()) {
		case 0: nl = '\r\n'; break;
		case 1: nl = '\r'; break;
	}

	r('resources').setVariable('indentation', indentation);
	r('resources').setVariable('newline', nl);
}

var editorProxy = emmet.exec(function(require, _) {
	return {
		ctx: function() {
			return Npp.editor;
		},

		getSelectionRange: function() {
			return {
				start: this.ctx().getSelectionStart(),
				end: this.ctx().getSelectionEnd()
			};
		},

		createSelection: function(start, end) {
			if (_.isUndefined(end)) {
				end = start;
			}

			this.ctx().setSelection(start, end);
		},

		getCurrentLineRange: function() {
			var sel = this.getSelectionRange();
			return {
				start: this.ctx().lineFromPosition(sel.start),
				end: this.ctx().lineFromPosition(sel.end)
			};
		},

		getCaretPos: function() {
			return this.ctx().getCurrentPos();
		},

		setCaretPos: function(pos) {
			this.ctx().gotoPos(pos);
		},

		getCurrentLine: function() {
			return this.ctx().getCurLine();
		},

		replaceContent: function(value, start, end, noIndent) {
			if (_.isUndefined(end)) 
				end = _.isUndefined(start) ? content.length : start;
			if (_.isUndefined(start)) start = 0;

			var utils = require('utils');
			
			// indent new value
			if (!noIndent) {
				value = utils.padString(value, utils.getLinePadding(this.getCurrentLine()));
			}
			
			// find new caret position
			var tabstopData = require('tabStops').extract(value, {
				escape: function(ch) {
					return ch;
				}
			});
			value = tabstopData.text;
			var firstTabStop = tabstopData.tabstops[0];
			
			if (firstTabStop) {
				firstTabStop.start += start;
				firstTabStop.end += start;
			} else {
				firstTabStop = {
					start: value.length + start,
					end: value.length + start
				};
			}
			
			// insert new text
			this.ctx().setTarget(start, end);
			this.ctx().replaceTarget(value);
			this.createSelection(firstTabStop.start, firstTabStop.end);
		},

		getContent: function() {
			return this.ctx().getText();
		},

		getSyntax: function() {
			var syntax = this._syntax || 'html';
			var fileExt = 'html';
			var m = this.getFilePath().match(/\.(\w+)$/i);
			if (m) {
				fileExt = m[1];
			}

			if (syntax == 'user') {
				syntax = fileExt;
			}

			// maybe it's XSL?
			if (syntax == 'xml' && fileExt == 'xsl') {
				syntax = 'xsl';
			}

			return require('actionUtils').detectSyntax(this, syntax);
		},

		getProfileName: function() {
			return require('actionUtils').detectProfile(this);
		},

		prompt: function(title) {
			return Npp.notepad.prompt(title, 'Emmet');
		},

		getSelection: function() {
			return this.ctx().getSelText();
		},

		getFilePath: function() {
			return notepad.getCurrentFilename();
		}
	};
});