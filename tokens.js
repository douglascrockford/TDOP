// tokens.js
// http://crockford.com/javascript/tdop/tdop.html
// https://github.com/douglascrockford/TDOP
// Douglas Crockford
// 2021-05-04
// Public Domain

// Produce an array of simple token objects from a string.
// A simple token object contains these members:
//      type: "name", "string", "number", "operator"
//      value: string or number value of the token
//      from: index of first character of the token
//      to: index of the last character + 1

// Comments of the // type are ignored.

// Operators are by default single characters. Multicharacter
// operators can be made by supplying a string of prefix and
// suffix characters.
// characters. For example,
//      "<>+-&", "=>&:"
// will match any of these:
//      <=  >>  >>>  <>  >=  +: -: &: &&: &&

// This program augments 'String.prototype'
// because I wrote it when I was young and foolish.

String.prototype.tokens = function (prefix, suffix) {
    "use strict";
    var c;                      // The current character.
    var from;                   // The index of the start of the token.
    var i = 0;                  // The index of the current character.
    var length = this.length;
    var n;                      // The number value.
    var q;                      // The quote character.
    var str;                    // The string value.

    var result = [];            // An array to hold the results.

    var make = function (type, value) {

// Make a token object.

        return {
            type: type,
            value: value,
            from: from,
            to: i
        };
    };

// Begin tokenization. If the source string is empty, return nothing.

    if (!this) {
        return;
    }

// If prefix and suffix strings are not provided, supply defaults.

    if (typeof prefix !== "string") {
        prefix = "<>+-&";
    }
    if (typeof suffix !== "string") {
        suffix = "=>&:";
    }


// Loop through this text, one character at a time.

    c = this.charAt(i);
    while (c) {
        from = i;

// Ignore whitespace.

        if (c <= " ") {
            i += 1;
            c = this.charAt(i);

// name.

        } else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
            str = c;
            i += 1;
            while (true) {
                c = this.charAt(i);
                if (
                    (c >= "a" && c <= "z")
                    || (c >= "A" && c <= "Z")
                    || (c >= "0" && c <= "9")
                    || c === "_"
                ) {
                    str += c;
                    i += 1;
                } else {
                    break;
                }
            }
            result.push(make("name", str));

// number.

// A number cannot start with a decimal point. It must start with a digit,
// possibly "0".

        } else if (c >= "0" && c <= "9") {
            str = c;
            i += 1;

// Look for more digits.

            while (true) {
                c = this.charAt(i);
                if (c < "0" || c > "9") {
                    break;
                }
                i += 1;
                str += c;
            }

// Look for a decimal fraction part.

            if (c === ".") {
                i += 1;
                str += c;
                while (true) {
                    c = this.charAt(i);
                    if (c < "0" || c > "9") {
                        break;
                    }
                    i += 1;
                    str += c;
                }
            }

// Look for an exponent part.

            if (c === "e" || c === "E") {
                i += 1;
                str += c;
                c = this.charAt(i);
                if (c === "-" || c === "+") {
                    i += 1;
                    str += c;
                    c = this.charAt(i);
                }
                if (c < "0" || c > "9") {
                    make("number", str).error("Bad exponent");
                }
                do {
                    i += 1;
                    str += c;
                    c = this.charAt(i);
                } while (c >= "0" && c <= "9");
            }

// Make sure the next character is not a letter.

            if (c >= "a" && c <= "z") {
                str += c;
                i += 1;
                make("number", str).error("Bad number");
            }

// Convert the string value to a number. If it is finite, then it is a good
// token.

            n = +str;
            if (isFinite(n)) {
                result.push(make("number", n));
            } else {
                make("number", str).error("Bad number");
            }

// string

        } else if (c === "\"" || c === "'") {
            str = "";
            q = c;
            i += 1;
            while (true) {
                c = this.charAt(i);
                if (c < " ") {
                    make("string", str).error(
                        (
                            (c === "\n" || c === "\r" || c === "")
                            ? "Unterminated string."
                            : "Control character in string."
                        ),
                        make("", str)
                    );
                }

// Look for the closing quote.

                if (c === q) {
                    break;
                }

// Look for escapement.

                if (c === "\\") {
                    i += 1;
                    if (i >= length) {
                        make("string", str).error("Unterminated string");
                    }
                    c = this.charAt(i);
                    switch (c) {
                    case "b":
                        c = "\b";
                        break;
                    case "f":
                        c = "\f";
                        break;
                    case "n":
                        c = "\n";
                        break;
                    case "r":
                        c = "\r";
                        break;
                    case "t":
                        c = "\t";
                        break;
                    case "u":
                        if (i >= length) {
                            make("string", str).error("Unterminated string");
                        }
                        c = parseInt(this.substr(i + 1, 4), 16);
                        if (!isFinite(c) || c < 0) {
                            make("string", str).error("Unterminated string");
                        }
                        c = String.fromCharCode(c);
                        i += 4;
                        break;
                    }
                }
                str += c;
                i += 1;
            }
            i += 1;
            result.push(make("string", str));
            c = this.charAt(i);

// comment.

        } else if (c === "/" && this.charAt(i + 1) === "/") {
            i += 1;
            while (true) {
                c = this.charAt(i);
                if (c === "\n" || c === "\r" || c === "") {
                    break;
                }
                i += 1;
            }

// combining

        } else if (prefix.indexOf(c) >= 0) {
            str = c;
            i += 1;
            while (true) {
                c = this.charAt(i);
                if (i >= length || suffix.indexOf(c) < 0) {
                    break;
                }
                str += c;
                i += 1;
            }
            result.push(make("operator", str));

// single-character operator

        } else {
            i += 1;
            result.push(make("operator", c));
            c = this.charAt(i);
        }
    }
    return result;
};

