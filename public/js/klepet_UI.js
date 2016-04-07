function divElementEnostavniTekst(sporocilo) {
  
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;

  var jeVideo = sporocilo.match(/((http(s)?:\/\/)?)(www\.)?((youtube\.com\/))/gi);

  var jeSlika = sporocilo.match(/(https?:[^\s]+\S+\.jpg|png|gif)/gi);

  if (jeVideo){
     return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  if (jeSlika){   //preverimo ce je notri URL slike, ce je ...
    //sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('\'200px\' /&gt;', '\'200px\'" />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo); //na koncu izpisemo
  }
  if (jeSmesko) {
    //ne rabimo tega, ker izpisemo kot .html(sporocilo), ce pa nima smeskov pa .text(sporocilo)
    //sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
 
  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();


  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajVideo(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  
  var sistemskoSporocilo;
  
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });
  
  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('dregljaj', function(){
    
    $('#vsebina').jrumble();
    $('#vsebina').trigger('startRumble');
      /*setTimeout(konec, 1500);
    };*/
    setTimeout(function() { 
    $('#vsebina').trigger('stopRumble')
      
    }, 1500);
    
  })
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}



$('#seznam-uporabnikov').click(function(x) {
  
  var vzdevek = $(x.target).text();
    $('#poslji-sporocilo').val('/zasebno "' + vzdevek  + '"'); // se vedno je treba dodati besedilo zasebnega sporocila v "narekovaje", drugace je undefined
    $('#poslji-sporocilo').focus();
    
});





function dodajVideo(vhodnoBesedilo){

  if (vhodnoBesedilo.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11,11}).*/gi )){ //pogledamo ce sploh vsebuje linke za youtube
    //regexi za youtube url: /((http(s)?:\/\/)?)(www\.)?((youtube\.com\/))/gi            /((http(s)?:\/\/)?)(www\.)?((youtube\.com\/)|(youtu.be\/))[\S]+/gi
    var linkiVbesedilu = vhodnoBesedilo.match(/((http(s)?:\/\/)?)(www\.)?((youtube\.com\/)|(youtu.be\/))[\S]+/gi);

    
    //pride slika za celotnim stringom
    for (var i = 0; i < linkiVbesedilu.length; i++){
     
      linkiVbesedilu[i] = linkiVbesedilu[i].replace(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11,11}).*/gi, '$2');//vrinemo slike na konec besedila
   // tukaj dobimo pod $2 11 mestni ID videa
     vhodnoBesedilo = vhodnoBesedilo +"<iframe width='200px' height='150px' style='margin-left:20px;' src='https://www.youtube.com/embed/" + linkiVbesedilu[i]+ "' allowfullscreen ></iframe>";
    }
  }
  
  return vhodnoBesedilo;
}



function dodajSlike(vhodnoBesedilo){
  
  if (vhodnoBesedilo.match(/(https?:[^\s]+\S+\.jpg|png|gif)/gi)){
    var linkiVbesedilu = vhodnoBesedilo.match(/(https?:[^\s]+\S+\.jpg|png|gif)/gi);
    //pride slika za celotnim stringom
    
    for (var i = 0; i < linkiVbesedilu.length; i++){  //vrinemo slike na konec besedila
     vhodnoBesedilo = vhodnoBesedilo + "<img src='"+linkiVbesedilu[i]+"' style='margin-left:20px;' width='200px' />";
    }
  }
   return vhodnoBesedilo;
}



