/* NUGET: BEGIN LICENSE TEXT
 *
 * Microsoft grants you the right to use these script files for the sole
 * purpose of either: (i) interacting through your browser with the Microsoft
 * website or online service, subject to the applicable licensing or use
 * terms; or (ii) using the files as included with a Microsoft product subject
 * to that product's license terms. Microsoft reserves all other rights to the
 * files not expressly granted by Microsoft, whether by implication, estoppel
 * or otherwise. Insofar as a script file is dual licensed under GPL,
 * Microsoft neither took the code under GPL nor distributes it thereunder but
 * under the terms set out in this paragraph. All notices and licenses
 * below are for informational purposes only.
 *
 * NUGET: END LICENSE TEXT */
/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
/*! NOTE: If you're already including a window.matchMedia polyfill via Modernizr or otherwise, you don't need this part */
window.matchMedia = window.matchMedia || (function(doc, undefined){
  
  var bool,
      docElem  = doc.documentElement,
      refNode  = docElem.firstElementChild || docElem.firstChild,
      // fakeBody required for <FF4 when executed in <head>
      fakeBody = doc.createElement('body'),
      div      = doc.createElement('div');
  
  div.id = 'mq-test-1';
  div.style.cssText = "position:absolute;top:-100em";
  fakeBody.style.background = "none";
  fakeBody.appendChild(div);
  
  return function(q){
    
    div.innerHTML = '&shy;<style media="'+q+'"> #mq-test-1 { width: 42px; }</style>';
    
    docElem.insertBefore(fakeBody, refNode);
    bool = div.offsetWidth == 42;  
    docElem.removeChild(fakeBody);
    
    return { matches: bool, media: q };
  };
  
})(document);




/*! Respond.js v1.2.0: min/max-width media query polyfill. (c) Scott Jehl. MIT/GPLv2 Lic. j.mp/respondjs  */
(function( win ){
	//exposed namespace
	win.respond		= {};
	
	//define update even in native-mq-supporting browsers, to avoid errors
	respond.update	= function(){};
	
	//expose media query support flag for external use
	respond.mediaQueriesSupported	= win.matchMedia && win.matchMedia( "only all" ).matches;
	
	//if media queries are supported, exit here
	if( respond.mediaQueriesSupported ){ return; }
	
	//define vars
	var doc 			= win.document,
		docElem 		= doc.documentElement,
		mediastyles		= [],
		rules			= [],
		appendedEls 	= [],
		parsedSheets 	= {},
		resizeThrottle	= 30,
		head 			= doc.getElementsByTagName( "head" )[0] || docElem,
		base			= doc.getElementsByTagName( "base" )[0],
		links			= head.getElementsByTagName( "link" ),
		requestQueue	= [],
		
		//loop stylesheets, send text content to translate
		ripCSS			= function(){
			var sheets 	= links,
				sl 		= sheets.length,
				i		= 0,
				//vars for loop:
				sheet, href, media, isCSS;

			for( ; i < sl; i++ ){
				sheet	= sheets[ i ],
				href	= sheet.href,
				media	= sheet.media,
				isCSS	= sheet.rel && sheet.rel.toLowerCase() === "stylesheet";

				//only links plz and prevent re-parsing
				if( !!href && isCSS && !parsedSheets[ href ] ){
					// selectivizr exposes css through the rawCssText expando
					if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
						translate( sheet.styleSheet.rawCssText, href, media );
						parsedSheets[ href ] = true;
					} else {
						if( (!/^([a-zA-Z:]*\/\/)/.test( href ) && !base)
							|| href.replace( RegExp.$1, "" ).split( "/" )[0] === win.location.host ){
							requestQueue.push( {
								href: href,
								media: media
							} );
						}
					}
				}
			}
			makeRequests();
		},
		
		//recurse through request queue, get css text
		makeRequests	= function(){
			if( requestQueue.length ){
				var thisRequest = requestQueue.shift();
				
				ajax( thisRequest.href, function( styles ){
					translate( styles, thisRequest.href, thisRequest.media );
					parsedSheets[ thisRequest.href ] = true;
					makeRequests();
				} );
			}
		},
		
		//find media blocks in css text, convert to style blocks
		translate			= function( styles, href, media ){
			var qs			= styles.match(  /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi ),
				ql			= qs && qs.length || 0,
				//try to get CSS path
				href		= href.substring( 0, href.lastIndexOf( "/" )),
				repUrls		= function( css ){
					return css.replace( /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g, "$1" + href + "$2$3" );
				},
				useMedia	= !ql && media,
				//vars used in loop
				i			= 0,
				j, fullq, thisq, eachq, eql;

			//if path exists, tack on trailing slash
			if( href.length ){ href += "/"; }	
				
			//if no internal queries exist, but media attr does, use that	
			//note: this currently lacks support for situations where a media attr is specified on a link AND
				//its associated stylesheet has internal CSS media queries.
				//In those cases, the media attribute will currently be ignored.
			if( useMedia ){
				ql = 1;
			}
			

			for( ; i < ql; i++ ){
				j	= 0;
				
				//media attr
				if( useMedia ){
					fullq = media;
					rules.push( repUrls( styles ) );
				}
				//parse for styles
				else{
					fullq	= qs[ i ].match( /@media *([^\{]+)\{([\S\s]+?)$/ ) && RegExp.$1;
					rules.push( RegExp.$2 && repUrls( RegExp.$2 ) );
				}
				
				eachq	= fullq.split( "," );
				eql		= eachq.length;
					
				for( ; j < eql; j++ ){
					thisq	= eachq[ j ];
					mediastyles.push( { 
						media	: thisq.split( "(" )[ 0 ].match( /(only\s+)?([a-zA-Z]+)\s?/ ) && RegExp.$2 || "all",
						rules	: rules.length - 1,
						hasquery: thisq.indexOf("(") > -1,
						minw	: thisq.match( /\(min\-width:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ), 
						maxw	: thisq.match( /\(max\-width:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" )
					} );
				}	
			}

			applyMedia();
		},
        	
		lastCall,
		
		resizeDefer,
		
		// returns the value of 1em in pixels
		getEmValue		= function() {
			var ret,
				div = doc.createElement('div'),
				body = doc.body,
				fakeUsed = false;
									
			div.style.cssText = "position:absolute;font-size:1em;width:1em";
					
			if( !body ){
				body = fakeUsed = doc.createElement( "body" );
				body.style.background = "none";
			}
					
			body.appendChild( div );
								
			docElem.insertBefore( body, docElem.firstChild );
								
			ret = div.offsetWidth;
								
			if( fakeUsed ){
				docElem.removeChild( body );
			}
			else {
				body.removeChild( div );
			}
			
			//also update eminpx before returning
			ret = eminpx = parseFloat(ret);
								
			return ret;
		},
		
		//cached container for 1em value, populated the first time it's needed 
		eminpx,
		
		//enable/disable styles
		applyMedia			= function( fromResize ){
			var name		= "clientWidth",
				docElemProp	= docElem[ name ],
				currWidth 	= doc.compatMode === "CSS1Compat" && docElemProp || doc.body[ name ] || docElemProp,
				styleBlocks	= {},
				lastLink	= links[ links.length-1 ],
				now 		= (new Date()).getTime();

			//throttle resize calls	
			if( fromResize && lastCall && now - lastCall < resizeThrottle ){
				clearTimeout( resizeDefer );
				resizeDefer = setTimeout( applyMedia, resizeThrottle );
				return;
			}
			else {
				lastCall	= now;
			}
										
			for( var i in mediastyles ){
				var thisstyle = mediastyles[ i ],
					min = thisstyle.minw,
					max = thisstyle.maxw,
					minnull = min === null,
					maxnull = max === null,
					em = "em";
				
				if( !!min ){
					min = parseFloat( min ) * ( min.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
				}
				if( !!max ){
					max = parseFloat( max ) * ( max.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
				}
				
				// if there's no media query at all (the () part), or min or max is not null, and if either is present, they're true
				if( !thisstyle.hasquery || ( !minnull || !maxnull ) && ( minnull || currWidth >= min ) && ( maxnull || currWidth <= max ) ){
						if( !styleBlocks[ thisstyle.media ] ){
							styleBlocks[ thisstyle.media ] = [];
						}
						styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] );
				}
			}
			
			//remove any existing respond style element(s)
			for( var i in appendedEls ){
				if( appendedEls[ i ] && appendedEls[ i ].parentNode === head ){
					head.removeChild( appendedEls[ i ] );
				}
			}
			
			//inject active styles, grouped by media type
			for( var i in styleBlocks ){
				var ss		= doc.createElement( "style" ),
					css		= styleBlocks[ i ].join( "\n" );
				
				ss.type = "text/css";	
				ss.media	= i;
				
				//originally, ss was appended to a documentFragment and sheets were appended in bulk.
				//this caused crashes in IE in a number of circumstances, such as when the HTML element had a bg image set, so appending beforehand seems best. Thanks to @dvelyk for the initial research on this one!
				head.insertBefore( ss, lastLink.nextSibling );
				
				if ( ss.styleSheet ){ 
		        	ss.styleSheet.cssText = css;
		        } 
		        else {
					ss.appendChild( doc.createTextNode( css ) );
		        }
		        
				//push to appendedEls to track for later removal
				appendedEls.push( ss );
			}
		},
		//tweaked Ajax functions from Quirksmode
		ajax = function( url, callback ) {
			var req = xmlHttp();
			if (!req){
				return;
			}	
			req.open( "GET", url, true );
			req.onreadystatechange = function () {
				if ( req.readyState != 4 || req.status != 200 && req.status != 304 ){
					return;
				}
				callback( req.responseText );
			}
			if ( req.readyState == 4 ){
				return;
			}
			req.send( null );
		},
		//define ajax obj 
		xmlHttp = (function() {
			var xmlhttpmethod = false;	
			try {
				xmlhttpmethod = new XMLHttpRequest();
			}
			catch( e ){
				xmlhttpmethod = new ActiveXObject( "Microsoft.XMLHTTP" );
			}
			return function(){
				return xmlhttpmethod;
			};
		})();
	
	//translate CSS
	ripCSS();
	
	//expose update for re-running respond later on
	respond.update = ripCSS;
	
	//adjust on resize
	function callMedia(){
		applyMedia( true );
	}
	if( win.addEventListener ){
		win.addEventListener( "resize", callMedia, false );
	}
	else if( win.attachEvent ){
		win.attachEvent( "onresize", callMedia );
	}
})(this);

// SIG // Begin signature block
// SIG // MIIdkAYJKoZIhvcNAQcCoIIdgTCCHX0CAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFOUxUIg8Gqmq
// SIG // ZzTQOc5mQ4X/uR83oIIYUjCCBMEwggOpoAMCAQICEzMA
// SIG // AADY5HX5RW9I964AAAAAANgwDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTE3MTAwMjIy
// SIG // NTc1N1oXDTE5MDEwMjIyNTc1N1owgbExCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDDAKBgNVBAsTA0FPQzEmMCQGA1UECxMd
// SIG // VGhhbGVzIFRTUyBFU046NzBERC00QjVCLTQ1NjgxJTAj
// SIG // BgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZp
// SIG // Y2UwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// SIG // AQDEdrH+gvcvpCHco9ekKLslb5bz483ZhNRRSAG+4FJe
// SIG // 1ApJ3dp5arl3hiR0HV9ts5mNfEB//BIx/L6E7uew6iiU
// SIG // RZKpA/j0PO/jOI9mltu0Ah4h1QExB3R3pU9ADVEqMRE5
// SIG // QHuHeoHerC/2gMJKhUqk53C31XgHpzCe03t7S5i2AZOf
// SIG // QiP05n9mArFPmdJ0NEtAB+iBwCmwyy1D2dSluHeTJooN
// SIG // WDCJ7GqAxyb5rl8lGehsZbmexl/lsRdl6MRUbjKOjlqw
// SIG // hEd4J8f1t6JsxznNfwv6ASPIRCwUB/LkyWKiPIhsfMqg
// SIG // 8mBEx6GTXR9KBXiDnwL1RZVGExNyVqWzLRdHAgMBAAGj
// SIG // ggEJMIIBBTAdBgNVHQ4EFgQUoB5ujx8l3cpDZ4OVKfp3
// SIG // vVHWHlYwHwYDVR0jBBgwFoAUIzT42VJGcArtQPt2+7Mr
// SIG // sMM1sw8wVAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2Ny
// SIG // bC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
// SIG // TWljcm9zb2Z0VGltZVN0YW1wUENBLmNybDBYBggrBgEF
// SIG // BQcBAQRMMEowSAYIKwYBBQUHMAKGPGh0dHA6Ly93d3cu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljcm9zb2Z0
// SIG // VGltZVN0YW1wUENBLmNydDATBgNVHSUEDDAKBggrBgEF
// SIG // BQcDCDANBgkqhkiG9w0BAQUFAAOCAQEAhQ3sEz3Vev2z
// SIG // BTCtJKoLyPGO7dWLx6xpr6XQP2Ns8fhEXdIPXRDbR05X
// SIG // wDwtV9eWJQ12TT3aOy2OsDCXKP613I8xWf7SLxh3CGkB
// SIG // OdrSSlvqZl3670FluF96UHWz07AsHA0hj3AyJp3nNHWr
// SIG // YVj4nFsQYNTSHkgw7HbKqREqdJErPYPXy0FlIvcB5RXo
// SIG // W7q4DiQlqUNY5DbKVLye8TJrU0xCLuljxAxh1PC8R62g
// SIG // pbC9PwczzShPObgd/uf8jrqylP1fJB/6G8cwdN18SOEK
// SIG // W6VNQ9smrDneyVZghhGxwUWprR1c+kp1VVb4iVLKBlef
// SIG // 43cx7l8lCMvSyklMLk3cpDCCBgAwggPooAMCAQICEzMA
// SIG // AADDDpun2LLc9ywAAAAAAMMwDQYJKoZIhvcNAQELBQAw
// SIG // fjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWlj
// SIG // cm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAxMTAeFw0x
// SIG // NzA4MTEyMDIwMjRaFw0xODA4MTEyMDIwMjRaMHQxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xHjAcBgNVBAMTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjCCASIwDQYJKoZIhvcNAQEBBQAD
// SIG // ggEPADCCAQoCggEBALtX1zjRsQZ/SS2pbbNjn3q6tjoh
// SIG // W7SYro3UpIGgxXXFLO+CQCq3gVN382MBCrzON4QDQENX
// SIG // gkvO7R+2/YBtycKRXQXH3FZZAOEM61fe/fG4kCe/dUr8
// SIG // dbJyWLbFSJszYgXRlZSlvzkirY0STUZi2jIZzqoiXFZI
// SIG // sW9FyWd2Yl0wiKMvKMUfUCrZhtsaESWBwvT1Zy7neR31
// SIG // 4hx19E7Mx/znvwuARyn/z81psQwLYOtn5oQbm039bUc6
// SIG // x9nBYWHylRKhDQeuYyHY9Jkc/3hVge6leegggl8K2rVT
// SIG // GVQBVw2HkY3CfPFUhoDhYtuCcz4mXvBAEtI51SYDDYWI
// SIG // MV8KC4sCAwEAAaOCAX8wggF7MB8GA1UdJQQYMBYGCisG
// SIG // AQQBgjdMCAEGCCsGAQUFBwMDMB0GA1UdDgQWBBSnE10f
// SIG // IYlV6APunhc26vJUiDUZrzBRBgNVHREESjBIpEYwRDEM
// SIG // MAoGA1UECxMDQU9DMTQwMgYDVQQFEysyMzAwMTIrYzgw
// SIG // NGI1ZWEtNDliNC00MjM4LTgzNjItZDg1MWZhMjI1NGZj
// SIG // MB8GA1UdIwQYMBaAFEhuZOVQBdOCqhc3NyK1bajKdQKV
// SIG // MFQGA1UdHwRNMEswSaBHoEWGQ2h0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY0NvZFNpZ1BD
// SIG // QTIwMTFfMjAxMS0wNy0wOC5jcmwwYQYIKwYBBQUHAQEE
// SIG // VTBTMFEGCCsGAQUFBzAChkVodHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NlcnRzL01pY0NvZFNpZ1BD
// SIG // QTIwMTFfMjAxMS0wNy0wOC5jcnQwDAYDVR0TAQH/BAIw
// SIG // ADANBgkqhkiG9w0BAQsFAAOCAgEATZdPNH7xcJOc49Ua
// SIG // S5wRfmsmxKUk9N9E1CS6s2oIiZmayzHncJv/FB2wBzl/
// SIG // 5DA7EyLeDsiVZ7tufvh8laSQgjeTpoPTSQLBrK1Z75G3
// SIG // p2YADqJMJdTc510HAsooNGU7OYOtlSqOyqDoCDoc/j57
// SIG // QEmUTY5UJQrlsccK7nE3xpteNvWnQkT7vIewDcA12SaH
// SIG // X/9n7yh094owBBGKZ8xLNWBqIefDjQeDXpurnXEfKSYJ
// SIG // EdT1gtPSNgcpruiSbZB/AMmoW+7QBGX7oQ5XU8zymInz
// SIG // nxWTyAbEY1JhAk9XSBz1+3USyrX59MJpX7uhnQ1pgyfr
// SIG // gz4dazHD7g7xxIRDh+4xnAYAMny3IIq5CCPqVrAY1LK9
// SIG // Few37WTTaxUCI8aKM4c60Zu2wJZZLKABU4QBX/J7wXqw
// SIG // 7NTYUvZfdYFEWRY4J1O7UPNecd/311HcMdUaYzUql36f
// SIG // Zjdfz1Uz77LKvCwjqkQe7vtnSLToQsMPilFYokYCYSZa
// SIG // Gb9clOmoQHDnWzBMfIDUUGeipe4O6z218eV5HuH1WBlv
// SIG // u4lteOIgWCX/5Eiz5q/xskAEF0ZQ1AxskRR97sri9ibe
// SIG // GzsEZ1EuD6QX90L/P5GJMfinvLPlOlLcKjN/SmSRZdhl
// SIG // Ebbbare0bFL8v4txFsQsznOaoOldCMFFRaUphuwBMW1e
// SIG // dMZWMQswggYHMIID76ADAgECAgphFmg0AAAAAAAcMA0G
// SIG // CSqGSIb3DQEBBQUAMF8xEzARBgoJkiaJk/IsZAEZFgNj
// SIG // b20xGTAXBgoJkiaJk/IsZAEZFgltaWNyb3NvZnQxLTAr
// SIG // BgNVBAMTJE1pY3Jvc29mdCBSb290IENlcnRpZmljYXRl
// SIG // IEF1dGhvcml0eTAeFw0wNzA0MDMxMjUzMDlaFw0yMTA0
// SIG // MDMxMzAzMDlaMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQTCC
// SIG // ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ+h
// SIG // bLHf20iSKnxrLhnhveLjxZlRI1Ctzt0YTiQP7tGn0Uyt
// SIG // dDAgEesH1VSVFUmUG0KSrphcMCbaAGvoe73siQcP9w4E
// SIG // mPCJzB/LMySHnfL0Zxws/HvniB3q506jocEjU8qN+kXP
// SIG // CdBer9CwQgSi+aZsk2fXKNxGU7CG0OUoRi4nrIZPVVIM
// SIG // 5AMs+2qQkDBuh/NZMJ36ftaXs+ghl3740hPzCLdTbVK0
// SIG // RZCfSABKR2YRJylmqJfk0waBSqL5hKcRRxQJgp+E7VV4
// SIG // /gGaHVAIhQAQMEbtt94jRrvELVSfrx54QTF3zJvfO4OT
// SIG // oWECtR0Nsfz3m7IBziJLVP/5BcPCIAsCAwEAAaOCAasw
// SIG // ggGnMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFCM0
// SIG // +NlSRnAK7UD7dvuzK7DDNbMPMAsGA1UdDwQEAwIBhjAQ
// SIG // BgkrBgEEAYI3FQEEAwIBADCBmAYDVR0jBIGQMIGNgBQO
// SIG // rIJgQFYnl+UlE/wq4QpTlVnkpKFjpGEwXzETMBEGCgmS
// SIG // JomT8ixkARkWA2NvbTEZMBcGCgmSJomT8ixkARkWCW1p
// SIG // Y3Jvc29mdDEtMCsGA1UEAxMkTWljcm9zb2Z0IFJvb3Qg
// SIG // Q2VydGlmaWNhdGUgQXV0aG9yaXR5ghB5rRahSqClrUxz
// SIG // WPQHEy5lMFAGA1UdHwRJMEcwRaBDoEGGP2h0dHA6Ly9j
// SIG // cmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3Rz
// SIG // L21pY3Jvc29mdHJvb3RjZXJ0LmNybDBUBggrBgEFBQcB
// SIG // AQRIMEYwRAYIKwYBBQUHMAKGOGh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljcm9zb2Z0Um9v
// SIG // dENlcnQuY3J0MBMGA1UdJQQMMAoGCCsGAQUFBwMIMA0G
// SIG // CSqGSIb3DQEBBQUAA4ICAQAQl4rDXANENt3ptK132855
// SIG // UU0BsS50cVttDBOrzr57j7gu1BKijG1iuFcCy04gE1CZ
// SIG // 3XpA4le7r1iaHOEdAYasu3jyi9DsOwHu4r6PCgXIjUji
// SIG // 8FMV3U+rkuTnjWrVgMHmlPIGL4UD6ZEqJCJw+/b85HiZ
// SIG // Lg33B+JwvBhOnY5rCnKVuKE5nGctxVEO6mJcPxaYiyA/
// SIG // 4gcaMvnMMUp2MT0rcgvI6nA9/4UKE9/CCmGO8Ne4F+tO
// SIG // i3/FNSteo7/rvH0LQnvUU3Ih7jDKu3hlXFsBFwoUDtLa
// SIG // FJj1PLlmWLMtL+f5hYbMUVbonXCUbKw5TNT2eb+qGHpi
// SIG // Ke+imyk0BncaYsk9Hm0fgvALxyy7z0Oz5fnsfbXjpKh0
// SIG // NbhOxXEjEiZ2CzxSjHFaRkMUvLOzsE1nyJ9C/4B5IYCe
// SIG // FTBm6EISXhrIniIh0EPpK+m79EjMLNTYMoBMJipIJF9a
// SIG // 6lbvpt6Znco6b72BJ3QGEe52Ib+bgsEnVLaxaj2JoXZh
// SIG // tG6hE6a/qkfwEm/9ijJssv7fUciMI8lmvZ0dhxJkAj0t
// SIG // r1mPuOQh5bWwymO0eFQF1EEuUKyUsKV4q7OglnUa2ZKH
// SIG // E3UiLzKoCG6gW4wlv6DvhMoh1useT8ma7kng9wFlb4kL
// SIG // fchpyOZu6qeXzjEp/w7FW1zYTRuh2Povnj8uVRZryROj
// SIG // /TCCB3owggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZI
// SIG // hvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAw
// SIG // BgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRl
// SIG // IEF1dGhvcml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoX
// SIG // DTI2MDcwODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEoMCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmlu
// SIG // ZyBQQ0EgMjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIP
// SIG // ADCCAgoCggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0Ib
// SIG // KmvpWlCquAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnV
// SIG // ARQxQtOJDXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mp
// SIG // K656Ca/XllnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQu
// SIG // A3WraPPLbfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj
// SIG // 3gcN1Vx5pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuAS
// SIG // OrdJXtjt7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7
// SIG // La4zWMW3Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzlu
// SIG // ZH9TupwPrRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgo
// SIG // tswnKDglmDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd
// SIG // 0yFLPlLEtVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKC
// SIG // X9vAFbO9G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTf
// SIG // v0aZxe/CHFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt
// SIG // 1u1L50kppxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1t
// SIG // wyiPLI9AN0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11g
// SIG // lZo+TzOE2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGj
// SIG // ggHtMIIB6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4E
// SIG // FgQUSG5k5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGC
// SIG // NxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8G
// SIG // A1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQ
// SIG // Q7kUBU7h6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJ
// SIG // aHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwv
// SIG // cHJvZHVjdHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAz
// SIG // XzIyLmNybDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUH
// SIG // MAKGQmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y2VydHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIy
// SIG // LmNydDCBnwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMw
// SIG // gYMwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9z
// SIG // b2Z0LmNvbS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0
// SIG // bTBABggrBgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBw
// SIG // AG8AbABpAGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4g
// SIG // HTANBgkqhkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPY
// SIG // dGcimwuWEeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/
// SIG // 6ArKO79HqaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpL
// SIG // HPM8QotS0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14
// SIG // eiPzE32mkHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAq
// SIG // PyprWEljHwlpblqYluSD9MCP80Yr3vw70L01724lruWv
// SIG // J+3Q3fMOr5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5
// SIG // CsYKwsatruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiy
// SIG // WYlobm+nt3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8V
// SIG // fUWnduVAKmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX
// SIG // 0O5dY0HjWwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HH
// SIG // Diju3mUv7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnF
// SIG // sZulP0V3HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX
// SIG // 4ut1eBrs6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDt
// SIG // BEyO3991bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jM
// SIG // pF3BoYibV3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJz
// SIG // Ew16UM0xggSqMIIEpgIBATCBlTB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExAhMzAAAAww6bp9iy3PcsAAAA
// SIG // AADDMAkGBSsOAwIaBQCggb4wGQYJKoZIhvcNAQkDMQwG
// SIG // CisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisG
// SIG // AQQBgjcCARUwIwYJKoZIhvcNAQkEMRYEFOS2lWLPbDcR
// SIG // hrpfXE4NPtOnfLv3MF4GCisGAQQBgjcCAQwxUDBOoCaA
// SIG // JABNAGkAYwByAG8AcwBvAGYAdAAgAEwAZQBhAHIAbgBp
// SIG // AG4AZ6EkgCJodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // bGVhcm5pbmcgMA0GCSqGSIb3DQEBAQUABIIBACAM3wqN
// SIG // zFium4/kqMfDuIRp4Fx31Lhmm5h+/J8uUk4JtAbO+9xC
// SIG // c1VL4ogckXQI38SiHao1fL5tjbWUP/8QZVGVgOoX4d4n
// SIG // rlaqJ2Ixl8EybMX/kuiuuCT8w9POxLOuQBlCYdmzy7K5
// SIG // aM3WX74zz9WLXmWwxCvxo2OvAjplUJpv8/TsvH2Ax0YO
// SIG // gKTS1Fm3nytBXnpevWz/U/zHR41Ubjvqh08336WJEyk9
// SIG // 93QavyeMgDM5TtFfmGVJFR2yBYG7Y4+FiYF6DJ3thpqf
// SIG // SAhLfEbdQn9P5snW2N7mgSg1zqwPJdxc+ZHvQB4BVo4c
// SIG // gOtDVVXNLtRYvzQ92b8tkKkpaLqhggIoMIICJAYJKoZI
// SIG // hvcNAQkGMYICFTCCAhECAQEwgY4wdzELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEhMB8GA1UEAxMYTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBAhMzAAAA2OR1+UVvSPeuAAAAAADYMAkG
// SIG // BSsOAwIaBQCgXTAYBgkqhkiG9w0BCQMxCwYJKoZIhvcN
// SIG // AQcBMBwGCSqGSIb3DQEJBTEPFw0xNzEyMjkwNjIwNTJa
// SIG // MCMGCSqGSIb3DQEJBDEWBBQ9Ik9N6NiOMXvkhxO0g/xl
// SIG // r+VSLzANBgkqhkiG9w0BAQUFAASCAQC14MUdn+y1aTAc
// SIG // judEETH3CBssbWZ2oYlVkwxgKkjSs9RHca57w1Sikelv
// SIG // VVCjjERKjZgGPisBOxY9VLzxuGDPuHAF/r+d1R40pnHp
// SIG // 8C3Hx2Fg9v4nRn04qp8lsqlyP2WDPTfnRV8nnuiLcL37
// SIG // /DQ+Fe5Uqnv3AlIlv+gcFaMUlLrykgs+iVgd7BsaH+rj
// SIG // /o/Do5Y76K1JiUVMF8wT1Yg8RG5UTbnoGcBNbgbGVWVy
// SIG // uBLbrV/vpWFtikXmnUkF4GOccJJFcE8W+BLI/1zZi4Ml
// SIG // mUG+Mp0G8qwR9CGWx3JptSPF98hAH4k30EXrCVN/sJn8
// SIG // 77Ei2BiwNM1mc6SSlsL8
// SIG // End signature block
