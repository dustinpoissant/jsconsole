var jsconsole = (function(){
  ncl = console.log;
  function objectMap(o, f){
    var allProps = Object.getOwnPropertyNames(o);
    var enumerableProps = [];
    var nonEnumerableProps = allProps.slice();
    for(var k in o){
      enumerableProps.push(k);
      nonEnumerableProps.splice(nonEnumerableProps.indexOf(k), 1);
    }
    var a = [];
    for(var i=0; i<enumerableProps.length; i++){
      a.push(
        f(o[enumerableProps[i]], enumerableProps[i], true)
      );
    }
    for(var i=0; i<nonEnumerableProps.length; i++){
      a.push(
        f(o[nonEnumerableProps[i]], nonEnumerableProps[i], false)
      );
    }
    return a;
  }
  function consolify(str){
    if(typeof(str) == "string") return '<span class="hljs-string">"' + str.replace(new RegExp("<", "g"), "&lt;") + '"</span>';
    else if(str instanceof Error) return str.message;
    else if(str instanceof DocumentFragment) return consolifyDocFrag(str);
    else if(str instanceof Array){
      return consolifyArray(str);
    } else if(str instanceof Node && str.nodeType == 3){
      str = str.textContent.trim().replace(new RegExp("\r", "g"), "").replace(new RegExp("\n", "g"), "");
      if(!str.length) return "<span class='jsc-etn'>Empty Text Node</span>";
      return '<span class="jsc-tn">'+str.replace(new RegExp("<", "g"), "&lt;")+'</span>';
    }  else if(str instanceof Node){
      return consolifyElement(str);
    } else if(str instanceof NodeList){
      return '<span class="hljs-literal">NodeList </span>' + consolifyArray(Array.prototype.slice.call(str));
    } else if(str instanceof HTMLCollection){
      return '<span class="hljs-literal">HTMLCollection </span>' + consolifyArray(Array.prototype.slice.call(str));
    } else if(typeof(str) == "boolean" || str === undefined || str === null){
      return '<span class="hljs-literal">' + str + '</span>';
    } else if(typeof(str) == "object"){
      return consolifyObject(str);
    } else if(typeof(str) == "number"){
      return '<span class="hljs-number">' + str + "</span>";
    }
    return str;
  }
  function consolifyArray(a){
    var str = '<span class="jsc-array"><span class="jsc-ae">&#9654;</span> <span class="jsc-al">('+a.length+')</span> [' + 
    a.map(function(item, index){
      return ('<span class="jsc-ai"><span class="jsc-aii hljs-attr">'+index+': </span>' + consolify(item) + ((index<a.length-1)?'<span class="jsc-ac">, </span>':"") + "</span>");
    }).join("") + 
    ']</span>';
    return str;
  }
  function consolifyObject(o){
    return '<span class="jsc-object"><span class="jsc-oe">&#9654;</span> {' + 
    objectMap(o, function(item, key, enumerable){
      var keys = Object.getOwnPropertyNames(o);
      var index = keys.indexOf(key);
      if(key.indexOf(" ") == -1){
        return ('<span class="jsc-op'+(enumerable?"":" jsc-nep")+'"><span class="jsc-ok hljs-attr">'+key+': </span>' + consolify(item) + ((index<keys.length-1)?'<span class="jsc-oc">, </span>':"") + "</span>");
      } else {
        return ('<span class="jsc-op'+(enumerable?"":" jsc-nep")+'"><span class="jsc-ok hljs-attr">"'+key+'": </span>' + consolify(item) + ((index<keys.length-1)?'<span class="jsc-oc">, </span>':"") + "</span>");
      }
    }).join("") + 
    '}</span>';
  }
  function renderChildren(children){
    var a = [];
    for(var i=0; i<children.length; i++){
      a.push(consolify(children[i]));
    }
    return a.join("");
  }
  function consolifyElement(el){
    var inlineElements = ["b", "big", "i", "em", "small", "tt", "abbr", "acronym", "cite", "code", "dfn", "em", "kbd", "strong", "samp", "var", "a", "bdo", "br", "img", "map", "object", "q", "span", "sub", "sup", "button", "input", "label", "select", "textarea"];
    function renderAttributes(attrs){
      if(!attrs.length) return "";
      var a = [];
      for(var i=0; i<attrs.length; i++){
        a.push('<span class="hljs-attr">' + attrs[i].name + '</span>=<span class="hljs-string">"' + attrs[i].value + '"</span>');
      }
      return " " + a.join(" ");
    }
    function containsBlockChildren(el){
      for(var i=0; i<el.children.length;i++){
        if(inlineElements.indexOf(el.children[i].tagName.toLowerCase()) == -1) return true;
      }
      return false;
    }
    if(!el.tagName) return "";
    var elementType = (inlineElements.indexOf(el.tagName.toLowerCase()) == -1)?"jsc-be":"jsc-ie";
    if(!containsBlockChildren(el)) elementType += " jsc-nbec"; // no block element children
    var str = '<span class="'+elementType+'"><span class="jsc-ee">&#9654; </span><span class="hljs-tag">&lt;<span class="hljs-name">' + el.tagName.toLowerCase() + '</span>' + renderAttributes(el.attributes) + "></span>";
    str += renderChildren(el.childNodes);
    str += '<span class="hljs-tag">&lt;/<span class="hljs-name">' + el.tagName.toLowerCase() + '</span>></span></span>';
    return str;
  }
  function consolifyDocFrag(df){
    var str = '<span class="jsc-be">' + ((df.childNodes.length)?'<span class="jsc-ee">&#9654; </span>':'') + '<span class="hljs-tag"><span class="hljs-name">#document-fragment</span></span>';
    str += renderChildren(df.childNodes);
    str += '</span>';
    return str;
  }
  function moveCursorToEnd($input){
    var range = document.createRange();
    range.selectNodeContents($input);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  function jsconsole(selector){
    if(typeof(selector) == "undefined") var selector = ".jsconsole";
    if(selector instanceof HTMLElement){
      jsconsole.create(selector);
      return;
    } else if(typeof(selector) == "string"){
      Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(jsconsole.create);
    }
  }
  jsconsole.create = function($console){
    if($console.__init) return;
    $console.__init = true;
    var defaultCode = $console.innerText.trim()
    if($console.getAttribute("data-run-btn") != null){
      var runText = $console.getAttribute("data-run-btn") || "Run";
      $console.innerHTML = '<pre class="jsconsole-code"><code class="jsconsole-output javascript"></code><code class="jsconsole-input" contenteditable>'+defaultCode.replace(new RegExp("<", "g"), "&lt;")+'</code></pre><button class="jsconsole-btn primary">'+runText+'</button>';
    } else $console.innerHTML = '<pre class="jsconsole-code"><code class="jsconsole-output javascript"></code><code class="jsconsole-input" contenteditable>'+defaultCode.replace(new RegExp("<", "g"), "&lt;")+'</code></pre>';
    var $output = $console.querySelector(".jsconsole-output"),
        $input = $console.querySelector(".jsconsole-input"),
        $code = $console.querySelector(".jsconsole-code"),
        history = [],
        historyIndex = null;
    function runCode(){
      var code = $input.innerText.trim(),
          ncl = console.log,
          nce = console.error,
          ncw = console.error;
      if(!code.length)return;
      if($console.getAttribute("data-preserve-default-code") != null){
        $input.innerText = defaultCode;
        moveCursorToEnd($input);
      } else {
        $input.innerHTML = "";
      }
      console.log = function(){
        Array.prototype.slice.call(arguments).forEach(function(log){
          var $log = document.createElement("div");
          $log.className = "jsconsole-cl";
          $log.innerHTML = consolify(log);
          $output.appendChild($log);
        });
      };
      console.error = function(){
        Array.prototype.slice.call(arguments).forEach(function(log){
          var $log = document.createElement("div");
          $log.className = "jsconsole-ce";
          $log.innerHTML = consolify(log);
          $output.appendChild($log);
        });
      };
      console.warn = function(){
        Array.prototype.slice.call(arguments).forEach(function(log){
          var $log = document.createElement("div");
          $log.className = "jsconsole-cw";
          $log.innerHTML = consolify(log);
          $output.appendChild($log);
        });
      };
      history.push(code);
      historyIndex = null;
      var $ran = document.createElement("div");
      $ran.className = "jsconsole-ran";
      $ran.innerHTML = code.replace(new RegExp("<", "g"), "&lt;");
      $output.appendChild($ran);
      if(typeof(hljs) != "undefined") hljs.highlightBlock($ran);
      var r = undefined;
      try {
        if(code[0]=="{" && code[code.length-1] == "}") code = "var evalTemp123987="+code+";evalTemp123987";
        r = eval.call(window, code);
        var $return = document.createElement("div");
        $return.className = "jsconsole-return";
        $return.innerHTML = consolify(r);
        $output.appendChild($return);
      } catch(e){
        console.error(e);
      }
      $code.scrollTop = $code.scrollHeight;
      console.log = ncl;
      console.error = nce;
      console.warn = ncw;
    };
    if($console.getAttribute("data-run-default") != null){
      runCode();
    }
    $input.addEventListener("keydown", function(e){
      if(e.keyCode == 13 && !e.shiftKey && $console.getAttribute("data-run-btn") === null){
        runCode();
        e.preventDefault();
        return false;
      }
      var currentNode = document.getSelection().baseNode || document.getSelection().anchorNode;
      if(
        e.keyCode == 38 &&
        (
          currentNode == $input ||
          currentNode == $input.childNodes[0]
        )
      ){
          if(historyIndex === null) historyIndex = history.length - 1;
          else historyIndex--;
          if(historyIndex < 0) historyIndex = 0;
          if(history[historyIndex]){
            $input.innerHTML = history[historyIndex];
            moveCursorToEnd($input);
          }
          e.preventDefault();
          return false;
      } else if(
        e.keyCode == 40 &&
        (
          currentNode == $input ||
          currentNode == $input.childNodes[$input.childNodes.length-1]
        )
      ){
          if(historyIndex === null) return;
          historyIndex++;
          if(historyIndex >= history.length){
            $input.innerHTML = "";
          }
          if(history[historyIndex]){
            $input.innerHTML = history[historyIndex];
            moveCursorToEnd($input);
          }
          e.preventDefault();
          return false;
      }
    });
    if($console.querySelector(".jsconsole-btn")) $console.querySelector(".jsconsole-btn").addEventListener("click", runCode);
    $console.addEventListener("click", function(e){
      if(
        e.target.classList.contains("jsc-ae") ||
        e.target.classList.contains("jsc-oe")
      ){
        if(e.target.parentElement.classList.contains("_expanded")){
          e.target.parentElement.classList.remove("_expanded");
          Array.prototype.slice.call(e.target.parentElement.querySelectorAll("._expanded")).forEach(function($el){
            $el.classList.remove("_expanded");
          });
        } else e.target.parentElement.classList.add("_expanded");
      }
      if(e.target.classList.contains("jsc-ee")) e.target.parentElement.classList.toggle("_expanded");
    });
  };
  if(document.readyState != "loading") jsconsole();
  else document.addEventListener("DOMContentLoaded", function(){
    jsconsole();
  });
  return jsconsole;
})();
