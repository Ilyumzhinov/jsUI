// NOTE: SwiftUI inspired collection of types for declarative HTML rendering in JavaScript.


// MARK: Base 
/** A wrapper around the object literal lookup.
 * @param {any} key
 * @param {Object} cases Cases that can fail should be lazily evaluated! E.g. { "case1": 1, "case2": "b", "caseCanFail": () => val }.
 * @param {any} defaultCase Must be provided.
 * @return {any} case selected.
*/
function switchCase(key, cases, defaultCase) {
  if (defaultCase === undefined)
    throw new Error("Default case for switchView not provided!")

  let case_selected = (cases[key] || defaultCase)

  // Check if a variable is a function
  // Reference: https://stackoverflow.com/a/19717946/5856760
  return case_selected instanceof Function ? case_selected() : case_selected
}


// MARK: Interfaces
/** Interface for View types.
 * Support HTML Global Attributes.
 * Interface reference: https://medium.com/@yuribett/javascript-abstract-method-with-es6-5dbea4b00027
 */
class ViewType {
  // Global attributes
  _class = null
  _id = null
  _style = null
  _title = null

  class(classID) { this._class = classID; return this }
  id(newID) { this._id = newID; return this }
  style(style_definitions) { this._style = style_definitions; return this }
  title(text) { this._title = text; return this }

  inherit_globalAtrs(view) {
    this._class = view._class
    this._id = view._id
    this._style = view._style
    this._title = view._title
    return this
  }

  /** @return {string} HTML of drawn view. */
  get render() { throw new Error(`Implementation of render() missing at ${this.constructor.name} !`) }
}

/** Interface for built-in HTML tag views. */
class BuiltinViewType extends ViewType {
  /** @return {string} Builds view using HTML tags. */
  get raw() { throw new Error(`Implementation of raw() missing at ${this.constructor.name}!`) }

  get render() { return this.raw }
}

/** Draws HTML code from a ViewType.
 * @param {ViewType} view
 * @return {string} HTML as a string.
*/
function html(view) {
  return drawRaw(view)
}

// Interal functions
/** Wraps around the raw type to provide the viewType functionality for non-view data
 * @param {(ViewType|any)} content
 * @return {string}
 */
function drawRaw(content) {
  return content instanceof ViewType ? content.render :
    content instanceof Array ? content.map(drawRaw).join('') :
      content
}

/** Renders an optional attribute
 * @param {?string} attribute
 * @param {"value"|"boolean"} type
 * @return {string}
*/
function render_optAtr(label, attribute = null, type = 'value') {
  return attribute != null ?
    switchCase(type, {
      'value': `${label}="${attribute}"`,
      'boolean': label
    }, '') :
    ''
}
function render_globalAtrs(view) {
  return [
    render_optAtr('class', view._class),
    render_optAtr('id', view._id),
    render_optAtr('style', view._style),
    render_optAtr('title', view._title)
  ].filter(x => x != '').join(' ')
}
/** Renders optional attributes as well as global attributes  
 * @param {[TagAtr]} optionalAttributes */
function render_commonAtr(view, optionalAttributes = [], includeGlobalAttributes = true) {
  return [
    optionalAttributes.map(atr => render_optAtr(atr.name, atr.val, atr.type)).filter(x => x != '').join(' '),
    (includeGlobalAttributes ? render_globalAtrs(view) : '')
  ].filter(x => x != '').join(' ')
}


// MARK: Generator type
// Creates HTML tag attribute structure
class TagAtr {
  constructor(name, val = null, type = "value") {
    this.name = name
    this.val = val
    this.type = type
  }
}

/** Type that generates Views for builtin HTML tags */
class _ElementView extends BuiltinViewType {
  elementName
  /** @type {any} HTML element content */
  content
  /** @type {[TagAtr]} Required attributes */
  atrsRequired
  /** @type {[TagAtr]} Optional attributes */
  atrsOpt

  constructor(elementName, content, atrsRequired = [], atrsOpt = []) {
    super()
    this.elementName = elementName
    this.content = content
    this.atrsRequired = atrsRequired
    this.atrsOpt = atrsOpt

    this.atrsRequired.concat(this.atrsOpt).map((atr) => {
      this[atr.name] = {
        'value': (val) => { this[`_${atr.name}`] = val; return this },
        'boolean': (val = true) => { this[`_${atr.name}`] = val; return this }
      }[atr.type]
    })
  }

  get raw() {
    return `<${this.elementName} ${render_commonAtr(this, this.atrsRequired.concat(this.atrsOpt).map(atr => { atr.val = this[`_${atr.name}`]; return atr }))}>${drawRaw(this.content)}</${this.elementName}>`
  }
}


// MARK: forEachView
class _forEachView extends ViewType {
  /** @type {[any]} Array of any elements to draw */
  elements
  /** Function to create an element view. Needs drawing */
  f_elToView

  constructor(elements, f_elToView) {
    super()
    this.elements = elements
    this.f_elToView = f_elToView
  }

  get render() {
    return this.elements.map(el => this.f_elToView(el)).map(drawRaw).join('')
  }
}
let forEachView = (data, f_view) => new _forEachView(data, f_view)


// MARK: HTML Elements by Category
// Reference: https://www.w3schools.com/TAGS/ref_byfunc.asp


// MARK: Basic HTML, 12 total
// REVIEW: Missing Basic HTML tags
// <head>   Contains metadata/information for the document
// <title>  Defines a title for the document
// <body>   Defines the document's body

/** Defines HTML headings */
let h1 = (...content) => new _ElementView('h1', content),
  h2 = (...content) => new _ElementView('h2', content),
  h3 = (...content) => new _ElementView('h3', content),
  h4 = (...content) => new _ElementView('h4', content),
  h5 = (...content) => new _ElementView('h5', content),
  h6 = (...content) => new _ElementView('h6', content)

/** Defines a paragraph */
let p = (...content) => new _ElementView('p', content)
/** Inserts a single line break */
let br = () => new _ElementView('br', null)
/** Defines a thematic change in the content */
let hr = () => new _ElementView('hr', null)


// MARK: Formatting, 33 total
// REVIEW: Missing Formatting tags
// <kbd>      Defines keyboard input
// <rp>       Defines what to show in browsers that do not support ruby annotations
// <rt>       Defines an explanation/pronunciation of characters (for East Asian typography)
// <ruby>     Defines a ruby annotation (for East Asian typography)
// <small>    Defines smaller text
// <template> Defines a container for content that should be hidden when the page loads
// <var>      Defines a variable
// <wbr>      Defines a possible line-break

/** Defines an abbreviation or an acronym */
let abbr = (...content) => new _ElementView('abbr', content)
/** Defines contact information for the author/owner of a document/article */
let address = (...content) => new _ElementView('address', content)
/** Defines bold text */
let b = (...content) => new _ElementView('b', content)
/** Isolates a part of text that might be formatted in a different direction from other text outside it */
let bdi = (...content) => new _ElementView('bdi', content)
/** Overrides the current text direction */
let bdo = (...content) => new _ElementView('bdo', content, [new TagAtr('dir')])
/** Defines a section that is quoted from another source */
let blockquote = (...content) => new _ElementView('blockquote', content, [], [new TagAtr('cite')])
/** Defines the title of a work */
let cite = (...content) => new _ElementView('cite', content)
/** Defines a piece of computer code */
let code = (...content) => new _ElementView('code', content)
/** Defines text that has been deleted from a document */
let del = (...content) => new _ElementView('del', content, [], [new TagAtr('cite'), new TagAtr('datetime')])
/** Specifies a term that is going to be defined within the content */
let dfn = (...content) => new _ElementView('dfn', content)
/** Defines emphasized text */
let em = (...content) => new _ElementView('em', content)
/** Defines a part of text in an alternate voice or mood */
let i = (...content) => new _ElementView('i', content)
/** Defines a text that has been inserted into a document */
let ins = (...content) => new _ElementView('ins', content, [], [new TagAtr('cite'), new TagAtr('datetime')])
/** Defines marked/highlighted text */
let mark = (...content) => new _ElementView('mark', content)
/** Defines a scalar measurement within a known range (a gauge) */
let meter = (...content) => new _ElementView('meter', content, [new TagAtr('value')], [new TagAtr('form'), new TagAtr('high'), new TagAtr('low'), new TagAtr('max'), new TagAtr('min'), new TagAtr('optimum')])
/** Defines preformatted text */
let pre = (...content) => new _ElementView('pre', content)
/** Represents the progress of a task */
let progress = (...content) => new _ElementView('progress', content, [new TagAtr('max'), new TagAtr('value')])
/** Defines a short quotation */
let q = (...content) => new _ElementView('q', content, [new TagAtr('cite')])
/** Defines text that is no longer correct */
let s = (...content) => new _ElementView('s', content)
/** Defines sample output from a computer program */
let samp = (...content) => new _ElementView('samp', content)
/** Defines important text */
let strong = (...content) => new _ElementView('strong', content)
/** Defines subscripted text */
let sub = (...content) => new _ElementView('sub', content)
/** Defines superscripted text */
let sup = (...content) => new _ElementView('sup', content)
/** Defines a specific time (or datetime) */
let time = (...content) => new _ElementView('time', content, [new TagAtr('datetime')])
/** Defines some text that is unarticulated and styled differently from normal text */
let u = (...content) => new _ElementView('u', content)


// MARK: Forms and Input, 12 total
// REVIEW: Missing Forms and Input tags
// TODO: <form>       Defines an HTML form for user input
// TODO: <input>      Defines an input control
// TODO: <textarea>   Defines a multiline input control (text area)
// TODO: <select>     Defines a drop-down list
// TODO: <optgroup>   Defines a group of related options in a drop-down list
// TODO: <option>     Defines an option in a drop-down list
// TODO: <label>      Defines a label for an <input> element
// TODO: <fieldset>   Groups related elements in a form
// TODO: <legend>     Defines a caption for a <fieldset> element
// TODO: <datalist>   Specifies a list of pre-defined options for input controls
// TODO: <outpu>      Defines the result of a calculation

/** Defines a clickable button */
let button = (...content) => new _ElementView('button', content,
  [new TagAtr('type')],
  [new TagAtr('autofocus', null, 'boolean'), new TagAtr('disabled', null, 'boolean'), new TagAtr('form'), new TagAtr('formaction'), new TagAtr('formenctype'), new TagAtr('formmethod'), new TagAtr('formnovalidate', null, 'boolean'), new TagAtr('formtarget'), new TagAtr('name'), new TagAtr('value')]
)


// MARK: Images, 8 total
// Missing Images tags
// <map>  Defines a client-side image map
// <area> Defines an area inside an image map

/** Defines an image */
let img = () => new _ElementView('img',
  [new TagAtr('src'), new TagAtr('alt')],
  [new TagAtr('crossorigin'), new TagAtr('ismap', null, 'boolean'), new TagAtr('loading'), new TagAtr('longdesc'), new TagAtr('referrerpolicy'), new TagAtr('usemap')]
)
/** Used to draw graphics, on the fly, via scripting */
let canvas = (...content) => new _ElementView('canvas', content)
/** Specifies self-contained content */
let figure = (...content) => new _ElementView('figure', content)
/** Defines a caption for a figure element */
let figcaption = (...content) => new _ElementView('figcaption', content)
/** Defines a container for multiple image resources */
let picture = (...content) => new _ElementView('picture', content)
/** Defines a container for SVG graphics */
let svg = (...content) => new _ElementView('svg', content)


// MARK: Audio / Video, 4 total
// Missing Audio / Video tags
// <track>  Defines text tracks for media elements (<video> and <audio>)

/** Defines sound content */
let audio = (...content) => new _ElementView('audio', content, [],
  [new TagAtr('autoplay', null, 'boolean'), new TagAtr('controls', null, 'boolean'), new TagAtr('loop', null, 'boolean'), new TagAtr('muted', null, 'boolean'), new TagAtr('preload')]
)
/** Defines multiple media resources for media elements (video, audio and picture) */
let source = () => new _ElementView('source', [],
  [new TagAtr('media'), new TagAtr('src'), new TagAtr('srcset'), new TagAtr('type')]
)
/** Defines a video or movie */
let video = (...content) => new _ElementView('video', content, [],
  [new TagAtr('autoplay', null, 'boolean'), new TagAtr('controls', null, 'boolean'), new TagAtr('loop', null, 'boolean'), new TagAtr('muted', null, 'boolean'), new TagAtr('poster'), new TagAtr('preload')]
)


// MARK: Links, 3 total
// Missing Links tags
// <link>   Defines the relationship between a document and an external resource (most used to link to style sheets)

/** Defines a hyperlink */
let a = (...content) => new _ElementView('a', content,
  [new TagAtr('href')],
  [new TagAtr('download', null, 'boolean'), new TagAtr('hreflang'), new TagAtr('media'), new TagAtr('referrerpolicy'), new TagAtr('rel'), new TagAtr('target'), new TagAtr('type')]
)
/** Defines navigation links */
let nav = (...content) => new _ElementView('nav', content)


// MARK: Lists, 6 total
// REVIEW: Missing List tags
// <dl>     Defines a description list
// <dt>     Defines a term/name in a description list
// <dd>     Defines a description of a term/name in a description list

/** Defines an unordered list */
let ul = (...content) => new _ElementView('ul', content)
/** Defines an unordered list */
let ol = (...content) => new _ElementView('ol', content, [], [new TagAtr('reversed', null, 'boolean'), new TagAtr('start'), new TagAtr('type')])
/** Defines a list item */
let li = (...content) => new _ElementView('li', content)


// MARK: Tables, 10 total
// REVIEW: Missinge Tables tags
// <col>        Specifies column properties for each column within a <colgroup> element
// <colgroup>   Specifies a group of one or more columns in a table for formatting

/** Defines a table */
let table = (...content) => new _ElementView('table', content)
/** Defines a table caption */
let caption = (...content) => new _ElementView('caption', content)
/** Defines a header cell in a table */
let th = (...content) => new _ElementView('th', content, [],
  [new TagAtr('abbr'), new TagAtr('colspan'), new TagAtr('headers'), new TagAtr('rowspan'), new TagAtr('scope')]
)
/** Defines a row in a table */
let tr = (...columns) => new _ElementView('tr', columns)
/** Defines a cell in a table */
let td = (...content) => new _ElementView('td', content, [],
  [new TagAtr('colspan'), new TagAtr('headers'), new TagAtr('rowspan')]
)
/** Groups the header content in a table */
let thead = (...content) => new _ElementView('thead', content)
/** Groups the body content in a table */
let tbody = (...trs) => new _ElementView('tbody', trs)
/** Groups the footer content in a table */
let tfoot = (...trs) => new _ElementView('tfoot', trs)


// MARK: Style and Semantics, 13 total
// REVIEW: Missing Style and Semantics tags
// <dialog> Defines a dialog box or window
// <data>   Adds a machine-readable translation of a given content 

/** Defines a section in a document */
let div = (...content) => new _ElementView('div', content)
/** Defines a section in a document */
let span = (...content) => new _ElementView('span', content)
/** Defines a header for a document or section */
let header = (...content) => new _ElementView('header', content)
/** Defines a footer for a document or section */
let footer = (...content) => new _ElementView('footer', content)
/** Specifies the main content of a document */
let main = (...content) => new _ElementView('main', content)
/** Defines a section in a document */
let section = (...content) => new _ElementView('section', content)
/** Defines an article */
let article = (...content) => new _ElementView('article', content)
/** Defines content aside from the page content */
let aside = (...content) => new _ElementView('aside', content)
/** Defines additional details that the user can view or hide */
let details = (...content) => new _ElementView('details', content, [], [new TagAtr('open', null, 'boolean')])
/** Defines additional details that the user can view or hide */
let summary = (...content) => new _ElementView('summary', content)
/** Defines additional details that the user can view or hide */
let data = (...content) => new _ElementView('data', content)