const SYMBOL =   /[\-+.]|([\-+.][a-zA-Z*!_?$%&=<>'\-+.#:][a-zA-Z*!_?$%&=<>'\-+.#:0-9]*)|([a-zA-Z*!_?$%&=<>][a-zA-Z*!_?$%&=<>'\-+.#:0-9]*)/;
const KEYWORD = /[a-zA-Z*!_?$%&=<>'\-+.#0-9][a-zA-Z*!_?$%&=<>'\-+.#0-9:]*/;

module.exports = grammar({
  name: 'clojure',
  // word: $ => $._symbol,
  extras: $ => [/[\s,]/, $.comment],
  rules: {
    source_file: $ => repeat($._form),
    comment: $ => /;.*/,
    _form: $ => choice($._non_discard, $.discard),
    _non_discard: $ => choice($._literal, $._reader_macro),
    discard: $ => seq('#_', optional($.discard), $._non_discard),
    _reader_macro: $ => choice(
      $.anonymous_function,
      $.meta_data,
      $.regex,
      $.var_quote,
      $.set,
      $.dispatch,
      $.deref,
      $.quote,
      $.backtick,
      $.unquote,
      $.unquote_splicing,
      $.gensym,
      $.reader_conditional,
      $.reader_conditional_splicing,
      $.host_expression
    ),
    function_symbol: $ => prec(2, $._symbol),
    anonymous_function: $ => seq('#(', repeat($._form), ')'),
    meta_data: $ => seq(choice('#^', '^'), choice($.map, $.symbol, $.keyword)),
    regex: $ => seq('#', $.string),
    var_quote: $ => seq('#\'', $.symbol),
    set: $ => seq('#{', repeat($._form), '}'),
    dispatch: $ => seq('#', $.symbol, $._form),
    deref: $ => seq('@', $._form),
    quote: $ => seq('\'', $._form),
    backtick: $ => seq('`', $._form),
    unquote: $ => seq('~', $._form),
    unquote_splicing: $ => seq('~@', $._form),
    gensym: $ => prec(1, seq($._symbol, '#')),
    reader_conditional: $ => seq("#?(", repeat(seq($.keyword, $._form)), ")"),
    reader_conditional_splicing: $ => seq("#?@(", repeat(seq($.keyword, $._form)), ")"),
    host_expression: $ => seq('#+', $._form, $._form),
    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
          /[^xu0-7]/,
          /[0-7]{1,3}/,
          /x[0-9a-fA-F]{2}/,
          /u[0-9a-fA-F]{4}/,
          /u{[0-9a-fA-F]+}/
      )
    )),
    string: $ => seq(
      '"',
      repeat(choice(
        token.immediate(/[^"\\]+/),
        $.escape_sequence
      )),
      '"'
    ),
    _literal: $ => choice(
      $.number,
      $.symbol,
      $.string,
      $.character,
      $.nil,
      $.boolean,
      $.keyword,
      $.namespaced_keyword,
      $.list,
      $.vector,
      $.map
    ),
    _simple_symbol: $ => choice(SYMBOL, "/"),
    symbol_namespace: $ => SYMBOL,
    symbol_name: $ => token.immediate(SYMBOL),
    _namespaced_symbol: $ => seq($.symbol_namespace, token.immediate("/"), $.symbol_name),
    _symbol: $ => choice(alias($._simple_symbol, $.symbol_name), $._namespaced_symbol),
    symbol: $ => $._symbol,

    keyword_prefix: $ => choice(":", "::"),
    keyword_namespace: $ => token.immediate(KEYWORD),
    keyword_name: $ => token.immediate(KEYWORD),
    keyword: $ => seq($.keyword_prefix, $.keyword_name),
    namespaced_keyword: $ => seq($.keyword_prefix,
                                 $.keyword_namespace,
                                 token.immediate("/"),
                                 $.keyword_name),
    nil: $ => "nil",
    boolean: $ => choice("true", "false"),
    character: $ => choice($._named, $._unicode, $._octal, $._any),
    _unicode: $ => /\\u[0-9D-Fd-f][0-9a-fA-F]{3}/,
    _octal: $ => /\\o[0-3][0-7]{2}/,
    _any: $ => /\\./,
    _named: $ => /\\(newline|return|space|tab|formfeed|backspace)/,
    number: $ => choice($._int, $._ratio, $._float),
    _int: $ => seq(choice("0", /([+-]?[1-9][0-9]*)/,
                          /[+-]?0[xX]([0-9A-Fa-f]+)/,
                          /[+-]?0([0-7]+)/,
                          /[+-]?([1-9][0-9]?)[rR]([0-9A-Za-z]+)/,
                          /[+-]?0[0-9]+/),
                   optional("N")),
    _ratio: $ => /([-+]?[0-9]+)\/([0-9]+)/,
    _float: $ => /([-+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?/,
    list: $ => seq('(', repeat($._form), ')'),
    vector: $ => seq('[', repeat($._form), ']'),
    map: $ => seq(
      optional(choice("#::", seq("#:", $._symbol))), '{', repeat($._form), '}'
    )
  }
});

