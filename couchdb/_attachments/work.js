$.fn.toggleName = function(name1, name2) {
  this.val(
    (this.val()==name1)? name2 : name1
  );
};

$.fn.toggleText = function(text1, text2) {
  this.text(
    (this.text()==text1)? text2 : text1
  );
};

function browseGlossary(callback) {
  var args=Array.slice ? Array.slice(arguments) : Array.prototype.slice.call(arguments);
  if (glossary) {
    var language,sentence;
    for (language in glossary) {
      for (sentence in glossary[language]) {
        args.shift();
        args.unshift(getGlossaryEntry(language,sentence));
        callback.apply(this,args);
      }
    }
  }
}

function getGlossaryEntry(language,sentence) {
  if (glossary && glossary[language] && glossary[language][sentence] ) {
    return {src_sentence:sentence,src_language:language,targets:glossary[language][sentence]};
  } else {
    return false;
  }
}

function addGlossaryEntry(glossaryEntry) {
  with (glossaryEntry) {
    glossary[src_language]=glossary[src_language] || {};
    glossary[src_language][src_sentence]=glossary[src_language][src_sentence] || {};
    if (!Object.keys(glossary[src_language][src_sentence]).length) {
      displayGlossaryAllText(glossaryEntry);
    }
    glossary[src_language][src_sentence][target_language]=target_sentence;
  }
}

function displayGlossaryAllText(glossaryEntry,version) {
  var versions;
  if (version) versions=[version];
  else versions=getVersions();
  versions.forEach(function(version) {
    displayGlossary(glossaryEntry,$(".unit",find(version)));
  });
}

function displayGlossary(glossaryEntry,element) {
  var l=element.getLanguage();
  if (l==glossaryEntry.src_language) {
    $("span.temp.glossary",
      element.highlight(glossaryEntry.src_sentence,"temp glossary"))
    .data("sentence",glossaryEntry.src_sentence)
    .removeClass("temp");
  }
}

function removeGlossary(glossaryEntry) {
  var g=getGlossaryEntry(glossaryEntry.src_language,glossaryEntry.src_sentence);
  if (g) {
    delete glossary[glossaryEntry.src_language][glossaryEntry.src_sentence][glossaryEntry.target_language];
    if (!Object.keys(glossary[glossaryEntry.src_language][glossaryEntry.src_sentence]).length) {
      getVersions().forEach(function(version) {
        var v=find(version);
        if (v.getLanguage()==glossaryEntry.src_language) {
          v.removeHighlight("glossary",glossaryEntry.src_sentence);
        }
      });
    }
  }
}

function editGlossaryEntry(glossaryEntry,language) {
  $("form#addGlossary [name='src']").val(glossaryEntry.src_sentence);
  $("form#addGlossary [name='target']").val(glossaryEntry.targets && glossaryEntry.targets[language] ? glossaryEntry.targets[language] : "");
  $("form#addGlossary [name='src_language']").val(glossaryEntry.src_language);
  $("form#addGlossary [name='target_language']").val(language);
  if (!$("form#addGlossary").is(":visible")) {
    toggleGlossaryEntry();
  }
}

function find(version) {
  return $(".pleat.open[data-version='"+version+"']");
}

function findPleat(version) {
  return $(".pleat.close[data-version='"+version+"']");
}

$.fn.getHeight = function() {
  var fake=$("<div>").css({"position":"fixed","left":"-1000px"}).append(this.clone());
  $(document.body).append(fake);
  var height=fake.outerHeight();
  fake.remove();
  return height;
};

$.fn.rotate = function () {
  return $("<div>").addClass("rotated-text__wrapper").append(
    $("<div>").addClass("rotated-text").append(this)
  );
};

function addPleat(version) {
  var header=find(version).filter("th").first();
  var pleat=$("<td/>").addClass("pleat").addClass("close").attr("rowspan",$("tbody tr").length).attr("data-version",version);
  var language=header.find(".language").clone(true,true);
  language.attr("title",language.html()).html(language.data("id")).removeClass("expand");
  pleat.append(language.rotate());
  pleat.append(header.find(".creator").clone(true,true).rotate());
  find(version).filter("td").first().after(pleat);
  var pleatHead=$("<th/>").addClass("pleat").addClass("close").append(
     $("<div>").addClass("relative-wrapper").append(
        $("<span>").addClass("button show").html("Montrer")
     )
  ).attr("data-version",version);
  header.after(pleatHead.clone());
  var pleatFoot=$("<th/>").addClass("pleat").addClass("close").attr("data-version",version);
  find(version).last().after(pleatHead);
}

function findUnits(version) {
  return find(version).find(".unit");
}

function getVersions() {
  var versions=[];
  $("#hexapla .header tr:first-child .pleat.open").each(function() {
    versions.push($(this).data("version"));
  });
  return versions;
}

function getSize(unit) {
  var rowspan=unit.closest("td").attr("rowspan");
  if (rowspan) return parseInt(rowspan);
  else return 1;
}

function positionSplits(context) {
  $("span.split",context).each(function() {
    var currTd=$(this).closest("td");
    var line=$(this).data("line");
    var position={};
    var tableLine=findLine(line);
    if (tableLine.find("td:visible").length>0) {
      position=tableLine.find("td:visible").position();
      $(this).removeClass("dynamic");
    } else {
      $(this).addClass("dynamic");
    }
    var currPos=$(this).closest("td").position();
    $(this).css("top",(position.top-currPos.top-24)+"px");
  });
  positionDynamicSplits(context);
}

function positionDynamicSplits(context) {
  $("span.split.dynamic",context).each(function() {
    var unit=$(this).closest(".unit");
    var currTop=unit.position().top;
    var currLine=$(this).data("line");
    var startTop,endTop,startLine,endLine;
    var prev=$(this).prev(".split:not(.dynamic)");
    if (prev.length==1) {
      startTop=prev.position().top-currTop;
      startLine=prev.data("line");
    } else {
      startTop=0;
      startLine=unit.getLine();
    }
    var next=$(this).next(".split:not(.dynamic)");
    if (next.length==1) {
      endTop=next.position().top-currTop;
      endLine=next.data("line");
    } else {
      endTop=unit.height();
      endLine=unit.getLine()+getSize(unit);
    }
    var lineDiff=(currLine-startLine)/(endLine-startLine);
    var top=lineDiff*(endTop-startTop);
    $(this).css("top",(top-24)+"px");
  });
}

function positionPleats() {
  var closedPleats=$(".pleat.close:visible");
  //pleats positioning is done automatically with FF23 and Chromium 28
  //chromium has a bug, which requires to redraw the fixed elements
  closedPleats.children(":visible").redraw();
  return;
}

//http://forrst.com/posts/jQuery_redraw-BGv
$.fn.redraw = function() {
  return this.hide(0, function(){$(this).show()});
};

function fixWidths() {
 var nbOpen=$("thead:first-child tr:first-child th.pleat.open:visible").length;
  if (nbOpen==0) {
    $("#hexapla").removeClass("full");
  } else {
    $("#hexapla").addClass("full");
    $("thead:first-child tr:first-child th.pleat.open:visible").css("width",100/nbOpen+"%");
  }
}

function toggleShow(version) {
  find(version).toggle();
  findPleat(version).toggle();
  fixWidths();
  //when one version is edited, and we show a non edited one, pagination is ugly
  //so we toggle edited versions twice to get back to correct pagination
  //applying to both top and bottom buttons, so we do it twice
  find($(".unit.edit").getVersion("td.open")).find("input.edit").each(toggleEdit);
  positionSplits();
}

$.fn.isEdited = function() {
  return this.hasClass("edit");
};

function htmlToString(unit) {
  if (unit.length>0)
    return unit.clone().removeHighlight("glossary").html()
      .replace(/<br\/?>\n*/g, "\n")
      .replace(/&lt;/g,"<")
      .replace(/&gt;/g,">")
      .replace(/&nbsp;/g," ")
      .replace(/ $/,"");
  return null;
}

function stringToHtml(formattedString) {
  return formattedString
    .replace(/</g,"&lt")
    .replace(/>/g,"&gt;")
    .replace(/^ /gm,"&nbsp;")
    .replace(/  /g," &nbsp;")
    .replace(/$/,"&nbsp;") // because a single <br> at end of text does not increase div.text size
    .replace(/\n/g,"<br>\n")
    ;
}

$.fn.getVersion = function(ancestor) {
  return this.closest(ancestor).data("version");
  return $(ancestor,$(this).closest("tr")).index($(this).closest(ancestor)) +1 ;
};

$.fn.getReference = function() {
  return {
    version: this.closest(".unit").data("version"),
    line: this.closest("tr").data("line")
  };
};

$.fn.getLanguage = function() {
  return find(this.getVersion("td.open")).find(".language").data("id");
};

$.fn.getLine = function() {
  return this.closest("tr").data("line");
};

function autoSize() {
  // Copy textarea contents; browser will calculate correct height of copy,
  // which will make overall container taller, which will make textarea taller.
  var text = stringToHtml($(this).val());
  $(this).parent().find("div.text").html(text);
  if ($(this).parents().is("box-wrapper")) {
      $(this).css({'width':'100%','height':'100%'});
  }
}

function modified() {
  $(this).addClass("dirty");
  if ($(this).is(".autosize")) {
    autoSize.apply(this);
    positionSplits($(this).closest(".unit"));
  }
}

function toggleEdit (e) {
  var version=$(this).getVersion("th.open");
  var doc = find(version);
  var units = findUnits(version);
  var top = doc.first();
  var edited = doc.isEdited();
  doc.find("input.edit").toggleName("Lire", "Editer");
  if (edited) {
    top.css("width","auto");
    doc.removeClass("edit");
    top.find("input.editedMeta").remove();
    top.find(".delete").remove();
    if (getVersions().length==1) {
      var fulltext=$("textarea.fulltext").val();
      var lines=fulltext.split("\n\n");
      var id=Traduxio.getId();
      var update=function(){
        $("#hexapla tbody tr").remove();
        lines.forEach(function(line,i) {
          var newUnit=$("<div/>");
          var text=$("<div>").addClass("text dirty");
          text.html(stringToHtml(line)).removeClass("dirty");
          newUnit.append(text);
          newUnit.addClass("unit").attr("data-version",version);
          var newTd=$("<td>").addClass("pleat open").attr("data-version",version).append($("<div>").addClass("box-wrapper").append(newUnit));
          newUnit.setSize(1);
          var tr=$("<tr/>").data("line",i).prepend(newTd);
          $("#hexapla tbody").append(tr);
        });
      };
      if ($("textarea.fulltext").is(".dirty")) {
        $.ajax({
            type:"PUT",
            data:JSON.stringify({key:"text",value:lines}),
            contentType: "text/plain",
            url:"work/"+id+"?version="+version
        }).done(update);
      } else {
        update();
      }
    }
  } else {
    doc.addClass("edit");
    top.css("width",doc.first().outerWidth()+"px");
  if(version != "original") {
  top.find(".relative-wrapper").prepend('<span class="button delete"></span>');
  top.find(".delete").on("click", clickDeleteVersion);
  }
    if (getVersions().length==1) {
        var fulltext="";
        var first=true;
        units.each(function() {
            if (first) first=false;
            else fulltext+="\n\n";
            fulltext+=htmlToString($(".text",this));
        });
        $("#hexapla tbody tr").remove();
        var textarea=$("<textarea/>").addClass("fulltext").val(fulltext);
        var tr=$("<tr/>").append($("<td/>").append($("<div>").addClass("unit edit").append(textarea)));
        $("#hexapla tbody").append(tr);
    }
  }
    if(version == "original") {
      setEditState(edited, top, "title", "Titre");
      setEditState(edited, top, "work-creator", "Auteur");
      setEditState(edited, top, "date", "Date, année, ou siècle de l'oeuvre");
      setLangEditState(edited, top, "Langue originale");
    } else {
      setEditState(edited, top, "title", "Titre traduit");
      setEditState(edited, top, "work-creator", "Auteur (translittéré si nécessaire)");
      setEditState(edited, top, "creator", "Traduction");
      setEditState(edited, top, "date", "Date, année, ou siècle de la traduction");
      setLangEditState(edited, top, "Langue de traduction");
    }
  units.each(function() {
    var unit=$(this);
    if ($(this).isEdited()) {
  var self=this;
  saveUnit.apply($(this).find('textarea'),[function () {
    $(self).find(".text").html(stringToHtml($(self).find("textarea").val()));
    unit.find(".split").remove();
    unit.find(".join").remove();
    unit.find("textarea").remove();
    unit.removeClass("edit");
  }]);
    } else {
  $(this).addClass("edit");
  var textarea=$("<textarea/>").addClass("autosize");
  textarea.val(htmlToString($(".text",this).removeHighlight("glossary")));
  $(this).prepend(textarea);
  $(this).find(".text").css("min-height",(getSize(unit)*32)+"px");
  autoSize.apply(textarea);
  if (getVersions().indexOf(version)>0) {
    createJoins(unit);
    createSplits(unit);
  }
    }
  });
  if (edited) browseGlossary(displayGlossaryAllText,version);

  if (e.hasOwnProperty("cancelable")) //means it is an event, and as such toggle occured on user action
    updateUrl();
}

var languages=null;

function fillLanguages(control,callback) {
  function updateSelect() {
    $.each(languages, function(key, o) {
      control.append("<option value=\""+key+"\">" + key + " (" + o.fr + " - " + o.en + " - " + o[key] + ")</option>");
    });
    if (typeof callback=="function")
      callback();
  };
  if (!languages) {
    $.getJSON(getPrefix() + "/shared/languages.json", function(result) {
      languages=result;
      updateSelect();
    }).fail(function() { alert("Cannot edit language field"); });;
  } else {
    updateSelect();
  }
}

function setLangEditState(isEdited, container, placeholder) {
  var target = container.find(".language");
  if(isEdited) {
    container.find("select").remove();
    target.removeClass("edit").show();
  } else {
    target.hide();
    var language = $("<select></select>");
    fillLanguages(language, function() {
      if (placeholder) {
        language.prepend("<option value=\"\">" + placeholder+"</option>");
        language.attr("title",placeholder);
      }
    language.val(target.data("id"));
    language.addClass("editedMeta").css("width", "50%");
    language.on("change", function() {
      var id = Traduxio.getId();
      var ref = $(this).closest("th").data("version");
      $.ajax({
        type: "PUT",
        url: "work/"+id+"/"+ref,
        contentType: 'text/plain',
        data: JSON.stringify({"key":"language", "value": language.val()})
      }).done(function() {
				var lang_id = language.val();
				fixLanguages(target.data("id",lang_id));
				fixLanguages($("#hexapla").find(".close[data-version='" + ref + "']").find(".language")
					.data("id", lang_id));
      }).fail(function() { alert("fail!"); });
    });
    target.addClass("edit");
    target.before(language);
    });
  }
}

function updateUrl() {
  var opened=$("thead:first-child th.open:visible").not(".edit").map(function() {return $(this).getVersion("th");}).toArray().join("|");
  var edited=$("thead:first-child th.edit:visible").map(function() {return $(this).getVersion("th");}).toArray().join("|");
  var suffix="";
  if (opened) {
    suffix+="open="+encodeURIComponent(opened);
  }
  if (edited) {
    suffix = suffix ? suffix + "&" :"";
    suffix+="edit="+encodeURIComponent(edited);
  }
  suffix = suffix ? "?"+suffix:"";

  window.history.pushState("object or string","",Traduxio.getId()+suffix);
}

function setEditState(isEdited, container, name, placeholder) {
  setEditStateForComponent(isEdited, container, name, "focusout", '<input type="text" class="editedMeta ' + name + '" />', placeholder);
}

function setEditStateForComponent(isEdited, container, name, event, textComponent, placeholder) {
  var target = container.find("." + name);
  if(isEdited) {
    target.removeClass("edit").show();
  } else {
    target.addClass("edit");
    var component=$(textComponent);
    component.attr("placeholder", placeholder);
    component.attr("title", placeholder);
    component.on(event, function() {
      if(component.hasClass("dirty")) {
        var id = Traduxio.getId();
        var ref = $(this).closest("th").data("version");
        $.ajax({
          type: "PUT",
          url: "work/"+id+"/"+ref,
          contentType: 'text/plain',
          data: JSON.stringify({"key": name, "value": component.val()})
        }).done(function(data) {
          if(name == "creator") {
            changeVersion(ref, data);
          }
          component.val(data);
          target.text(data);
          component.removeClass("dirty");
        }).fail(function() { alert("fail!"); });
      }
    });
    component.val($(target).text());
    target.before(component);
    target.hide();
  }
}

function changeVersion(oldVersion, newVersion) {
  $("#hexapla").find("*[data-version='" + oldVersion + "']")
    .attr("data-version", newVersion).data("version", newVersion)
    .find(".creator").html(newVersion);
  updateUrl();
}

function toggleHeader(item) {
  $(item).slideToggle(200);
  closeTop(item);
}

function toggleAddVersion() {
  toggleHeader("#addPanel");
}

function toggleRemoveDoc() {
  toggleHeader("#removePanel");
}

function toggleGlossaryEntry() {
  toggleHeader("#addGlossary");
}

function closeTop(except) {
  $(".top form, #removePanel").not(except).slideUp(200);
}

function addGlossarySubmit() {
  var id = Traduxio.getId();
  var form=$("#addGlossary");
  var glossaryEntry={
    src_sentence:$("[name='src']",form).val(),
    src_language:$("[name='src_language']",form).val(),
    target_sentence:$("[name='target']",form).val(),
    target_language:$("[name='target_language']",form).val()
  };
  if (glossaryEntry.src_sentence && glossaryEntry.src_language &&
    glossaryEntry.target_sentence && glossaryEntry.target_language) {
    var url="work/"+id+"/glossary/"+glossaryEntry.src_language+"/"+glossaryEntry.src_sentence+"/"+glossaryEntry.target_language;
    $.ajax({
      type: "PUT",
      url: url,
      dataType:"json",
      contentType: 'application/json',
      data: glossaryEntry.target_sentence
    }).done(function(result) {
      closeTop();
      if ("ok" in result) {
        addGlossaryEntry(glossaryEntry);
      }
    }).fail(function() { alert("fail!"); });
  } else {
    alert("missing data");
  }
  return false;
}

function addVersion() {
  var id = Traduxio.getId();
  var ref = $("#addPanel").find("input[type='text']").val();
  if(ref != "") {
    $.ajax({
    type: "PUT",
    url: "work/"+id+"/"+ref,
    contentType: 'text/plain',
    data: JSON.stringify({"key": "creator", "value": ref})
    }).done(function(result) {
    window.location.href = id + "?edit=" + result;
    }).fail(function() { alert("fail!"); });
  }
  return false;
}

function removeDoc() {
  if(confirm("La suppression est irréversible. Continuer ?")) {
    $.ajax({
    type: "PUT",
    url: "work/"+Traduxio.getId(),
    contentType: 'text/plain',
    data: JSON.stringify({"key": "remove"})
    }).done(function() {
    window.location.href = "./";
    }).fail(function(error) { alert("failed: " + error.statusText); });
  }
}

function clickDeleteVersion() {
  var ref = $(this).closest("th").data("version");
  if(confirm("Supprimer la traduction '" + ref + "' ?")) {
    deleteVersion(ref);
  }
}

function deleteVersion(version) {
  var id = Traduxio.getId();
  $.ajax({
    type: "PUT",
    url: "work/"+id+"/"+version,
    contentType: 'text/plain',
    data: JSON.stringify({"key": "delete"})
  }).done(function() {
    window.location.reload(true);
  }).fail(function() { alert("fail!"); });
}

function getEndLine (units,index) {
  var nextIndex=index+1;
  var lastLine=0;
  if (nextIndex<units.length) {
    var nextUnit=units.eq(nextIndex);
    lastLine=nextUnit.getReference().line - 1 ;
  } else {
    lastLine=$("#hexapla").data("lines") - 1;
  }
  return lastLine;

}

function createJoin(unit1,unit2) {
    var p=($(unit2).offset().top-$(unit1).offset().top-$(unit1).outerHeight()+32)/(-2);
    var join=$("<span/>").addClass("join").attr("title","merge with previous").css("top",p+"px");
    unit2.prepend(join);
}


function createJoins(unit) {
  if (unit.isEdited()) {
    unit.find(".join").remove();
    var version=unit.getVersion("td.open");
    var units=findUnits(version);
    var currIndex=units.index(unit);
    if (currIndex>0) {
      var prevUnit=units.eq(currIndex-1);
      createJoin(prevUnit,unit);
    }
  }
}

function createSplits(unit) {
  if (unit.isEdited()) {
    unit.find(".split").remove();
    var reference=unit.getReference();
    var version=reference.version;
    var currLine=reference.line;
    var units=findUnits(version);
    var currIndex=units.index(unit);
    var size=getSize(unit);
    var lastLine=currLine+size-1;
    var maxLines=$("#hexapla").data("lines");
    var currPos=unit.position();
    if (currLine<lastLine && currLine<maxLines) {
      for (var i=currLine+1; i<=lastLine; ++i) {
        var split=$("<span/>").addClass("split").attr("title","split line "+i).data("line",i);
        unit.append(split);
      }
      positionSplits();
    }
  }
}

function unedit() {
  var self=this;
  saveUnit.apply(this,[function() {
     var unit=$(self).closest(".unit");
     unit.html(stringToHtml($(self).val())).removeClass("edit");
  }]);
}

function saveUnit(callback) {
  var self=this;
  if ($(this).hasClass("dirty")) {
    $(this).prop("disabled",true);
    var content=$(this).closest(".unit").find("textarea").val();
    editOnServer(content, $(this).getReference()).done(function(message,result) {
      if (result == "success") {
        $(self).removeClass("dirty");
        $(self).prop("disabled",false);
        if (callback && typeof(callback) == "function") {
          callback();
        }
      } else {
        alert(result+":"+message);
      }
    })
    .always(function() {
      $(self).prop("disabled",false);
    });
  } else {
    if (callback && typeof(callback) == "function") {
      callback();
    }
  }
}

function deleteGlossaryEntry(glossaryEntry,language) {
  var id = $("#hexapla").data("id");
  if (glossaryEntry.src_sentence && glossaryEntry.src_language && language) {
    var url="work/"+id+"/glossary/"+glossaryEntry.src_language+"/"+glossaryEntry.src_sentence+"/"+language;
    $.ajax({
      type: "DELETE",
      url: url,
      dataType:"json",
      contentType: 'application/json'
    }).done(function(result) {
      if ("ok" in result) {
        glossaryEntry.target_language=language;
        removeGlossary(glossaryEntry);
      }
    }).fail(function() { alert("fail!"); });
  }
}

function openContextMenu(glossaryEntry,position) {
  var sentence=glossaryEntry.src_sentence;
  if (sentence && sentence.length<50 && glossaryEntry.src_language) {
    var menu=$("<div/>").addClass("context-menu");
    menu.append($("<div/>").addClass("concordance").append("search the concordance for <em>"+sentence+"</em>"));
    if(glossaryEntry.targets) {
      $.each(glossaryEntry.targets,function(language,sentence) {
        menuItem=$("<div/>").addClass("glossaryEntry").append("<em>"+language+"</em>:"+sentence);
        menuItem.append($("<span/>").append("x").addClass("action").on("click",function() {
          deleteGlossaryEntry(glossaryEntry,language);
        }));
        menuItem.append($("<span/>").append("e").addClass("action").on("click",function() {
          editGlossaryEntry(glossaryEntry,language);
        }));
        menu.append(menuItem);
      });
    }
    menu.append($("<div/>").addClass("glossary").append("add a translation of <em>"+sentence+"</em> to the glossary"));
    menu.append($("<div/>").addClass("forum action").append(
      '<a href="'+Traduxio.getId()+'/forum/'+encodeURIComponent("Glossaire "+glossaryEntry.src_language+":"+sentence)+'">discuter</a>')
    );
    menu.css(position);
    $("body .context-menu").remove();
    $("body").append(menu);
    $(".context-menu .concordance").on("click",function() {
      $("form.concordance #query").val(sentence);
      $("form.concordance #language").val(glossaryEntry.src_language);
      $("form.concordance").submit();
    }).addClass("action");
    $(".context-menu .glossary").on("click",function() {
      editGlossaryEntry(glossaryEntry);
    }).addClass("action");
    $(".context-menu .action").on("click",function() {
      $("body .context-menu").remove();
    });
  }
};

function unitContent(unit) {
  return htmlToString(unit.find(".text"));
}

function fillUnit(unit,content) {
  var oldVal=unitContent(unit);
  if (oldVal!=content) {
    if (unit.isEdited()) {
      var element=$("textarea",unit).val(content);
      autoSize.apply(element);
    } else {
      var element=$(".text",unit);
      element.html(stringToHtml(content));
      browseGlossary(displayGlossary,element);
    }
    return true;
  }
  return false;
}

$.fn.queueCss=function(properties) {
  $(this).queue(function (next) {
    $(this).css(properties);
    next();
  });
};

function highlightUnit(unit,color) {
  var version=unit.getVersion("td");
  var element=unit.isEdited() ? $("textarea",unit) : $(".text",unit);
  if (element.is(":visible")) {
    element.css({"background-color":color}).delay(1000).queueCss({"background-color":""});
    find(version).css({"border-color":color,"border-width":"0px 2px"}).clearQueue().delay(1000).queueCss({"border-color":"","border-width":""});
  } else {
    findPleat(version).css({"border-color":color,"border-width":"0px 2px"}).clearQueue().delay(1000).queueCss({"border-color":"","border-width":""});
  }
}

function createUnit(content,edit) {
  var newUnit = $("<div/>").addClass("unit");
  var text = $("<div>").addClass("text");
  newUnit.append(text);
  if (edit) {
    var textarea=$("<textarea>").addClass("autosize");
    newUnit.prepend(textarea).addClass("edit");
  }
  fillUnit(newUnit,content);
  return newUnit;
}

function findUnit(version,line) {
  var unit=$("tr[data-line='"+line+"'] .unit[data-version='"+version+"']");
  if (unit.length==0) return null;
  if (unit.length==1) return unit;
  return false;
}

function findLine(line) {
  return $("tr[data-line='"+line+"']");
}

function updateOnScreen(version,line,content,color) {
  var highlight=true;
  var unit=findUnit(version,line);
  if (unit) {
    if (content !== null) {
      if (!fillUnit(unit,content)) return false;
    } else {
      //join
      var units=findUnits(version);
      var previousUnit=units.eq(units.index(unit)-1);
      var content=[unitContent(previousUnit),unitContent(unit)].join("\n");
      fillUnit(previousUnit,content);
      var thisLine=unit.getLine();
      var prevLine=previousUnit.getLine();
      var size=getSize(unit);
      var newSpan=thisLine-prevLine+size;
      previousUnit.closest("td").attr("rowspan",newSpan);
      previousUnit.find(".text").css("min-height",(newSpan*32)+"px");
      unit.closest("td").remove();
      createJoins(previousUnit);
      createSplits(previousUnit);
      unit=previousUnit;
    }
  } else {
    if (content != null) { //otherwise, it is a join, which is already joined here
      //potential split
      var units=findUnits(version);
      units.each(function() {
        var cLine=$(this).getLine();
        if (typeof cLine != "undefined") {
          if (cLine<line) {
            unit=$(this);
          } else {
            return false;
        }
        }
      });
      if (unit) {
        var size = getSize(unit);
        var initialLine = unit.getLine();
        var edit=units.isEdited();
        var newUnit=createUnit(content,edit).attr("data-version",version);

        var newTd = $("<td>").addClass("pleat open").attr("data-version", version).append($("<div>").addClass("box-wrapper").append(newUnit));

        newUnit.setSize(size - (line - initialLine));
        unit.setSize(line - initialLine);
        var versions = getVersions();
        var versionIndex = versions.indexOf(version);
        if (versionIndex == 0) {
          findLine(line).prepend(newTd);
        } else {
          var ok = false;
          findLine(line).find(".unit").each(function() {
            var currVersion = $(this).data("version");
            if (versions.indexOf(currVersion) > versions.indexOf(version)) {
              $(this).closest("td").before(newTd);
              ok = true;
              return false;
            }
          });
          if (!ok) {
            findLine(line).append(newTd);
          }
        }
        unit=unit.add(newUnit);
        if (edit) {
          createJoins(unit);
          createSplits(unit);
          createJoins(newUnit);
          createSplits(newUnit);
        }
      }
    }
  }
  return unit;
}

function getPreviousUnit(unit) {
  var version=unit.getVersion("td.open");
  var units=findUnits(version);
  return $(units.eq(units.index(unit)-1));
}

var editOnServer = function(content, reference) {
  var id=Traduxio.getId();
  return $.ajax({
    type: "PUT",
    url: "version/"+id+"?"+ $.param(reference),
    contentType: "text/plain",
    data: content
  });
};

$(document).ready(function() {

  $("#hexapla").on("click", ".button.hide", function() {
    toggleShow($(this).getVersion("th.open"));
    updateUrl();
  });

  $("#hexapla").on("click", ".button.show", function() {
    toggleShow($(this).getVersion("th.close"));
    updateUrl();
  });

  $("#hexapla").on("click", ".button.edit-license", function() {
    window.location=getPrefix()+"/works/license/"+Traduxio.getId()+'/'+$(this).getVersion("th");
  });

  $("input.edit").on("click",toggleEdit);

  $("tr").on("mouseup select",".unit", function (e) {
    //requires jquery.selection plugin
    var txt=$.selection();
		if (txt) {
      e.stopPropagation();
      openContextMenu({
        src_sentence:txt,
        src_language:$(this).getLanguage(),
        target_language:$("td.pleat.open .unit.edit").getLanguage() //use first edited translation
      },{
        top:e.pageY+10,
        left:e.pageX
      });
    }
  });

  $("body").on("mouseup",".context-menu",function(e) {
    e.stopPropagation();
  });

  $("body").on("mouseup",function(e) {
    $("body .context-menu").remove();
  });

  $("tr").on("click", ".join", function(e) {
    e.stopPropagation();
    var unit=$(this).closest(".unit");
    var version=unit.getVersion("td");
    if (findUnits(version).index(unit)>0) {
      editOnServer("null", $(this).closest(".unit").getReference())
        .done(function() {
          updateOnScreen(version,unit.getLine(),null);
        });
    } else {
      $(this).remove();
    }
  });

  $.fn.setSize = function (size) {
    this.closest("td").attr("rowspan",size).find(".text").css("min-height",size*40+"px");
  };

  $("tr").on("click", ".split", function(e) {
    e.stopPropagation();
    var unit=$(this).closest(".unit");
    var line=$(this).data("line");
    var version=unit.data("version");
    editOnServer("", {
      version:version,
      line: line
    }).done(function() {
      updateOnScreen(version,line,"");
    });
  });

  $("#hexapla").on('change input cut paste','textarea,input.editedMeta',modified);

  $("tr").on("focusout", ".unit.edit textarea", saveUnit);

  $(".top").on("click", ".addVersion", toggleAddVersion);
  $(".top").on("click", ".removeDoc", toggleRemoveDoc);

  $("#addPanel").on("submit", addVersion);
  $("#removePanel").on("click", removeDoc);
  $("#addGlossary").on("submit", addGlossarySubmit);

  $(".unit .text").each(function() {
    $(this).html(
      stringToHtml(
        htmlToString(
          $(this)
        )
      )
    );
  });

  var versions=getVersions();
  const N = versions.length;
  for (var i = N-1; i>=0; i--) {
    addPleat(versions[i]);
  }
  if ($("th.pleat.opened,th.pleat.edited").length==0) {
    for (var i = 2; i<N; i++) {
      toggleShow(versions[i]);
    }
  } else {
    $("thead:first-child tr:first-child th.open.pleat").not(".opened").not(".edited").each(function() {
      toggleShow($(this).getVersion("th"));
    });
  }
  $("#hexapla th.edited").each(toggleEdit).removeClass("edited");
  fixWidths();

  if(N==0) {
    $("#work-info").show().on("submit",function(e) {
      e.preventDefault();
      var data={};
      ["work-creator","language","title","date"].forEach(function(field) {
        data[field]=$("[name='"+field+"']","#work-info").val();
      });
      data.original=$("[name=original-work]").prop("checked");
      $.ajax({
        type:"POST",
        url:"work",
        data:JSON.stringify(data),
        contentType:"application/json",
        dataType:"json"
      }).done(function(result) {
        if (result.ok && result.id) {
          window.location.href=result.id;
        } else {
          alert("fail");
        }
      }).fail(function(){alert("fail");});
      return false;
    });

    $(".top h1,.top img").hide();
  }
  if (N==1) {
    $(".button.hide").remove();
  }

  fillLanguages($("select.language"));

  Traduxio.activity.register("edit",function(edit) {
    if (edit.version) {
      var version=find(edit.version);
        switch (edit.action) {
          case "translated":
            if ("line" in edit && "content" in edit) {
              edit.message="Version <em>"+edit.version+"</em> modifiée à la ligne <a href='#"+edit.line+"'>"+edit.line+"</a>";
              if(!edit.isPast && version.length>0) {
                var unit=updateOnScreen(edit.version,edit.line,edit.content,edit.me?edit.color:null);
                if (unit && edit.color) {
                  highlightUnit(unit,edit.color);
                }
              }
            }
            break;
          case "edited":
            if (edit.key=="creator") {
              edit.message="version "+edit.version+" renomée";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            } else {
              edit.message="informations de la version "+edit.version+" modifiées";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            }
            break;
          case "created":
            edit.message="nouvelle version "+edit.version+" créée";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            break;
          case "deleted":
            edit.message="version "+edit.version+" supprimée";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            break;
        }
    }
    if (edit.message && Traduxio.chat && Traduxio.chat.addMessage) {
      Traduxio.chat.addMessage(edit);
    }
  });

  browseGlossary(displayGlossaryAllText);

  $("#hexapla").on("click",".glossary",function(e) {
    var l=$(this).getLanguage();
    var s=$(this).data("sentence");
    var entry=getGlossaryEntry(l,s);
    openContextMenu(entry,{top:e.pageY+10,left:e.pageX});
  });

  Traduxio.activity.register("glossary",function(edit) {
    if (edit.entry) {
      switch (edit.action) {
        case "added":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.target_sentence+"</em>"+
            " ajoutée";
          if (!edit.isPast) addGlossaryEntry(edit.entry);
          break;
        case "modified":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.was+"</em>"+
            " modifiée en <em>"+edit.entry.target_sentence+"</em>";
          if (!edit.isPast) addGlossaryEntry(edit.entry);
          break;
        case "deleted":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.was+"</em>"+
            " supprimée";
          if (!edit.isPast) removeGlossary(edit.entry);
          break;
      }

    }
    if (edit.message && Traduxio.chat && Traduxio.chat.addMessage) {
      Traduxio.chat.addMessage(edit);
    }

  });
});

$(window).load(function() {
  if (window.location.hash) {
    $("tr"+window.location.hash+" .unit").addClass("highlight");
    setTimeout(function() {$("tr"+window.location.hash+" .unit").removeClass("highlight");},500);
  }
});

