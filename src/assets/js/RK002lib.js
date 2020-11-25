"use strict";
/* eslint-disable */

var RK002 = RK002 || {};

RK002.rk005 = false; // interface is rk005
RK002.dbg = true;
RK002.dbg_rxtx = RK002.dbg && true;
RK002.dbg_rxtx_raw = RK002.dbg_rxtx && true;
RK002.dbg_rxtx_pck = RK002.dbg_rxtx && true;

/**************************************************************************//**
 * data I/O.
 ******************************************************************************/
RK002.read_uint8 = function(data,offset)
{
	var res =((offset < data.length) ? data[offset] : 0) & 0xff;
	return res;
}

RK002.read_uint16 = function(data,offset)
{
	var res = RK002.read_uint8(data,offset+1);
	res *= 1<<8;
	res += RK002.read_uint8(data,offset);
	return res;
}

RK002.read_uint32 = function(data,offset)
{
	var res = RK002.read_uint16(data,offset+2);
	res *= 1<<16;
	res += RK002.read_uint16(data,offset);
	return res;
}

RK002.read_string = function(data,offset,maxsz)
{
	var str = "";
	
	for (var i=0; (i<maxsz) && ((offset+i) < data.length); i++)
	{
		var c = data[offset+i];
		if ((c==0) || (c>127))
		{
			break;
		}
		str += String.fromCharCode(c);
	}
	
	return str;
}

RK002.vstostr = function(vs)
{
	var str;
	
	var vs_a = (vs>>8) & 0x0f;
	var vs_b = (vs>>4) & 0x0f;
	var vs_c = (vs>>0) & 0x0f;
	
	str = "" + vs_b.toString(16) + "." + vs_c.toString(16);
	
	return str;
}

RK002.crc32 = function(crc, data, offset, n)
{
	var j,b,msk;
	
	crc ^= 0xFFFFFFFF;
	
	while (n--)
	{
		b = data[offset++];
		crc = crc ^ b;
		for (j=7; j>=0; j--)
		{
			msk = -(crc & 1);
			crc = ((crc >> 1)&0x7FFFFFFF) ^ (0xEDB88320 & msk);
		}
	}
	
	crc ^= 0xFFFFFFFF;
	
	// AJH: force UINT32:
	crc = crc>>>0;
	
	return crc;
}

/**************************************************************************//**
 * RK002 cable types.
 ******************************************************************************/
RK002.cableTypeToString = function(cabletype)
{
	var cabletypes = ["RK002/INTERN","RK002/KVS","RK002/ARP","RK002/VID","RK002/SYNC","RK002/MOD","RK002/KOS"];
	
	if ((cabletype >= 0) && (cabletype < cabletypes.length))
	{
		return cabletypes[cabletype];
	}
	else
	{
		return "unknown type";
	}
}

/**************************************************************************//**
 * sysex.
 ******************************************************************************/
RK002.SysexCodec = function()
{
	var SYX_HEADER_SIZE				= 6;
	
	var syx_hdr = [0xF0,0x00,0x21,0x23,0x00,0x02];
	//                  \____________/ \_______/
	//                     retrokits     RK002
	
	var syx_hdr_legacy = [0xF0,0x7D,0x7F,0x56,0x47,0x53];
	
	var pcktypes = 
	[
	 {cmd:0x00,name:"boot0_req"},
	 {cmd:0x40,name:"boot0_rsp"},
	 {cmd:0x01,name:"boot1_req"},
	 {cmd:0x41,name:"boot1_rsp"},
	 {cmd:0x02,name:"checksum_req",arg:[{name:"adr",type:"uint32"},{name:"n",type:"uint32"}]},
	 {cmd:0x42,name:"checksum_rsp",arg:[{name:"adr",type:"uint32"},{name:"n",type:"uint32"},{name:"crc32",type:"uint32"}]},
	 {cmd:0x03,name:"writemem_req",arg:[{name:"adr",type:"uint32"},{name:"data",type:"uint8",dim:64}]},
	 {cmd:0x43,name:"writemem_rsp",arg:[{name:"adr",type:"uint32"},{name:"res",type:"uint8"}]},
	 {cmd:0x04,name:"readmem_req",arg:[{name:"adr",type:"uint32"}]},
	 {cmd:0x44,name:"readmem_rsp",arg:[{name:"adr",type:"uint32"},{name:"data",type:"uint8",dim:64}]},
	 {cmd:0x05,name:"exec_req",arg:[{name:"adr",type:"uint32"}]},
	 {cmd:0x06,name:"hardfault_ind",arg:[{name:"pc",type:"uint32"}]},
	 {cmd:0x07,name:"txtstr_ind",arg:[{name:"str",type:"string",dim:64}]},
	 {cmd:0x08,name:"setparam_req",arg:[{name:"nr",type:"uint16"},{name:"val",type:"uint16"}]},
	 {cmd:0x48,name:"setparam_rsp",arg:[{name:"nr",type:"uint16"},{name:"val",type:"uint16"}]},
	 {cmd:0x09,name:"getparam_req",arg:[{name:"nr",type:"uint16"}]},
	 {cmd:0x49,name:"getparam_rsp",arg:[{name:"nr",type:"uint16"},{name:"val",type:"uint16"}]},
	 {cmd:0x0a,name:"getnmbparams_req"},
	 {cmd:0x4a,name:"getnmbparams_rsp",arg:[{name:"n",type:"uint16"}]},
	 {cmd:0x0b,name:"getparamdef_req",arg:[{name:"param_nr",type:"uint16"}]},
	 {cmd:0x4b,name:"getparamdef_rsp",arg:[{name:"param_nr",type:"uint16"},{name:"min",type:"uint16"},{name:"max",type:"uint16"},{name:"def",type:"uint16"},{name:"flags",type:"uint8"},{name:"lbl",type:"string",dim:32}]},
	 {cmd:0x0c,name:"jump_req",arg:[{name:"adr",type:"uint32"}]},
	 {cmd:0x4c,name:"jump_rsp",arg:[{name:"adr",type:"uint32"},{name:"res",type:"uint8"}]},
	 	 
	 {cmd:0x00,name:"legacy_inquiry_req",legacy:true},
	 {cmd:0x40,name:"legacy_inquiry_rsp",legacy:true,arg:[{name:"cabletype",type:"uint8"},{name:"sz",type:"uint32"},{name:"cs",type:"uint32"},{name:"svnstr",type:"string",dim:64}]},
	 {cmd:0x01,name:"legacy_writemem_req",legacy:true,arg:[{name:"adr",type:"uint32"},{name:"data",type:"uint8",dim:64}]},
	 {cmd:0x41,name:"legacy_writemem_rsp",legacy:true,arg:[{name:"adr",type:"uint32"},{name:"res",type:"uint8"}]},
	 {cmd:0x02,name:"legacy_updatefw_req",legacy:true},
	 {cmd:0x42,name:"legacy_updatefw_rsp",legacy:true},
	 
	 
	]; 
	
	var encodeDat = function(srcdat)
	{
		var d;
		var msbctr = 8;
		var desdat = [];
		
		for (var srcidx=0; srcidx<srcdat.length; srcidx++)
		{
			if (msbctr >= 7)
			{
				desdat[desdat.length] = 0;
				msbctr = 0;
			}
			d = srcdat[srcidx];
			if (d & 0x80)
			{
				desdat[desdat.length - msbctr - 1] |= (1<<msbctr);
			}
			desdat[desdat.length] = d & 0x7f;
			msbctr ++;			
		}	
		
		return desdat;
	}
	
	var decodeDat = function(srcdat, offset, n)
	{
		var d;
		var msb;
		var desdat = [];
		
		for (var srcidx=0; srcidx<n; srcidx++)
		{
			d = srcdat[offset+srcidx];
			
			if ((srcidx & 7) == 0)
			{
				msb = d;
			}
			else
			{
				if (msb & 0x01)
				{
					d |= 0x80;
				}
				msb >>= 1;
				desdat[desdat.length] = d;
			}
		}
		
		return desdat;
	}
	
	this.encodePck = function(pck)
	{
		var res = [];
		
		for (var i=0; i<pcktypes.length; i++)
		{
			var pcktype = pcktypes[i];
			
			if ((pck.cmd == pcktype.cmd) || (pck.name == pcktype.name))
			{
				pck.cmd = pcktype.cmd;
				pck.name = pcktype.name;
				
				// parse possible args:
				if (typeof pcktype.arg !== 'undefined')
				{
					for (var j=0; j<pcktype.arg.length; j++)
					{
						var argtype = pcktype.arg[j];
						
						if (typeof pck[argtype.name] !== 'undefined')
						{
							var v = pck[argtype.name];
							var dim = (typeof argtype.dim !== 'undefined') ? argtype.dim : 0;
							
							if (dim == 0)
							{
								v = [v];
							}
							
							var k = 0;
							
							do
							{
								switch (argtype.type)
								{
									case "uint8":
										res.push((v[k]>>0)&255);
										break;
									
									case "uint16":
										res.push((v[k]>>0)&255);
										res.push((v[k]>>8)&255);
										break;
										
									case "uint32":
										res.push((v[k]>>0)&255);
										res.push((v[k]>>8)&255);
										res.push((v[k]>>16)&255);
										res.push((v[k]>>24)&255);
										break;
								}
								k++;
							} while ((k<dim) && (k<v.length));
						}
						else
						{
							break;
						}
					}
				}
				
				// <header><cmd><arg><f7>
				if (pcktype.legacy)
				{
					res = syx_hdr_legacy.concat([pck.cmd]).concat(encodeDat(res)).concat([0xf7]);
				}
				else
				{
					res = syx_hdr.concat([pck.cmd]).concat(encodeDat(res)).concat([0xf7]);
				}
				
				break;
			}
		}
		
		if (res.length == 0)
		{
			throw "trying to encode undefined packet type: name="+pck.name;
		}
		
		return res;
	}
		
	this.tryDecode = function(dat)
	{
		var res = null;
		
		if (dat.length > syx_hdr.length)
		{
			var isok = true;
			var rxlegacy = false;
			
			for (var i=0; (isok && (i<syx_hdr.length)); i++)
			{
				isok = (dat[i] == syx_hdr[i]);
			}
			
			if (!isok)
			{
				isok = true;
				rxlegacy = true;
				for (var i=0; (isok && (i<syx_hdr_legacy.length)); i++)
				{
					isok = (dat[i] == syx_hdr_legacy[i]);
				}
			}
			
			if (isok)
			{
				res = [];
				res.cmd = dat[syx_hdr.length];
				
				var n = dat.length - 2 - syx_hdr.length;
				if (n > 0)
				{
					dat = decodeDat(dat, syx_hdr.length + 1, n);
				}
				else
				{
					dat = [];
				}
				
				// now decode by cmd:
				for (var i=0; i<pcktypes.length; i++)
				{
					var pcktype = pcktypes[i];
					var pcklegacy = (typeof pcktype.legacy !== 'undefined') && pcktype.legacy;
					var legacymatch = (pcklegacy == rxlegacy);
					
					// is this the cmd? 
					if ((res.cmd == pcktype.cmd) && legacymatch)
					{
						// fill in some fields:
						res.name = pcktype.name;
						
						// parse possible args:
						if (typeof pcktype.arg !== 'undefined')
						{
							var datpos = 0;
							
							for (var j=0; (j<pcktype.arg.length) && (datpos<dat.length); j++)
							{
								var argtype = pcktype.arg[j];
								var v = [];
								var dim = (typeof argtype.dim !== 'undefined') ? argtype.dim : 0;
								
								if (argtype.type == "string")
								{
									v = "";
									for (var k=0; (k<dim) && (datpos<dat.length); k++)
									{
										var c = dat[datpos++];
										if (c>0)
										{
											v += String.fromCharCode(c);
										}
									}
								}
								else
								{
									var k = 0;
									do
									{
										switch (argtype.type)
										{
											case "uint8":
												v.push(RK002.read_uint8(dat,datpos));
												datpos += 1;
												break;
												
											case "uint16":
												v.push(RK002.read_uint16(dat,datpos));
												datpos += 2;
												break;
												
											case "uint32":
												v.push(RK002.read_uint32(dat,datpos));
												datpos += 4;
												break;
												
											case "string":
												
												break;
												
											default:
												console.log("unknown argtype '"+argtype.type+"'");
												break;
										}
										k++;
									} while (k<dim);
									
									if (dim == 0)
									{
										v = v[0];
									}
								}
								
								res[argtype.name] = v;
							}
						}
						
						
						// we've found our packet: break the loop
						break;
					}
				}
			}
		}
		
		return res;
	}
	
	var val2hex = function(val, width)
	{
		var str = "0x";
		
		do
		{
			width -= 8;
			str += RK002.bytehex((val>>width)&0xff);
		} while (width > 0);
		
		return str;
	}
	
	this.pckToString = function(pck)
	{
		var str = pck.name.toUpperCase();
		var first = true;
		
		// now decode by cmd:
		for (var i=0; i<pcktypes.length; i++)
		{
			var pcktype = pcktypes[i];
			
			if (pcktype.cmd == pck.cmd)
			{
				// parse possible args:
				if (typeof pcktype.arg !== 'undefined')
				{
					for (var j=0; (j<pcktype.arg.length); j++)
					{
						var argtype = pcktype.arg[j];
						if (typeof pck[argtype.name] !== 'undefined')
						{
							if (first)
							{
								str += " {";
							}
							else
							{
								str += ", ";
							}
							str += ""+argtype.name+"=";
							
							var val = pck[argtype.name];
							
							if (val.constructor === Array)
							{
								str += "[]";
							}
							else
							{
								switch (argtype.type)
								{
									case "uint8":
										str += val2hex(val,8);
										break;
										
									case "uint16":
										str += val2hex(val,16);
										break;
										
									case "uint32":
										str += val2hex(val,32);
										break;
										
									case "string":
										str += "\"" + val + "\"";
										break;
										
									default:
										str += val;
										break;
								}
							}
						
							first = false;
						}
					}
					if (!first)
					{
						str += "}";
					}
				}
			}
		}
		
		return str;
	}
}

RK002.sysexcodec = new RK002.SysexCodec();

RK002.Pck = function(name,arg)
{
	this.name = name;
	if (typeof arg !== "undefined")
	{
		if (arg.constructor === Array)
		{
			for (var i=0; i<arg.length; i++)
			{
				for (var argname in arg[i])
				{
					this[argname] = arg[i][argname];
				}
			}
		}
		else
		if (arg.constructor === Object)
		{
			for (var argname in arg)
			{
				this[argname] = arg[argname];
			}
		}
		else
		{
			for (var argname in arg)
			{
				this[argname] = arg[argname];
			}
		}
	}
}

/**************************************************************************//**
 * raw buffer.
 ******************************************************************************/
RK002.RawBuf = function()
{
	this.buf = [];
	this.length = 0;
	
	this.addByte = function(b)
	{
		this.buf[this.length++] = b & 255;
	}
	this.addUint16LE = function(v)
	{
		this.addByte(v);
		this.addByte(v>>8);
	}
	
	this.addUint32LE = function(v)
	{
		this.addUint16LE(v);
		this.addUint16LE(v>>16);
	}
	
	this.addString = function(str)
	{
		for (var i=0; i<str.length; i++)
		{
			this.addByte(str.charCodeAt(i));
		}
	}
}

/**************************************************************************//**
 * AUDIO encoder.
 ******************************************************************************/
RK002.AudioEncoder = function()
{
	var AUDIOENC_FS 						= 44100;
	var AUDIOENC_N_PULSES_SHORT				= 8;
	var AUDIOENC_N_PULSES_LONG				= 16;
	var AUDIOENC_N_PULSES_SYNC				= ((AUDIOENC_N_PULSES_SHORT + AUDIOENC_N_PULSES_LONG) * 2);
	var AUDIOENC_LEADIN_MS					= 100;
	var AUDIOENC_LEADOUT_MS					= 100;

	var signal = false;
	var idx = 0;
	var buf = [0];
	
	this.clear = function()
	{
		idx = 0;
		signal = false;
	}
	
	this.advanceT = function(count)
	{
		while (count--)
		{
			buf[idx++] = signal;
		}
	}
	
	this.invertSignal = function()
	{
		signal = !signal;
	}
		
	this.emitCarrier = function(t_ms)
	{
		var t = 0;

		while ((t * 1000 / AUDIOENC_FS) < t_ms)
		{
			this.invertSignal();
			this.advanceT(AUDIOENC_N_PULSES_SYNC);
			t += AUDIOENC_N_PULSES_SYNC;
		}		
	}
	
	this.emitByte = function(b)
	{
		var i;
		var shiftreg = b;
		
		for (var i=0; i<8; i++)
		{
			this.invertSignal();

			this.advanceT((shiftreg & 0x01) ? AUDIOENC_N_PULSES_LONG : AUDIOENC_N_PULSES_SHORT);

			shiftreg>>=1;
		}
	}
	
	this.getAsWavBase64Str = function()
	{
		var NUMCHN = 2;										// we generate a stereo sample; hopefully this is 'more compatible' :-)
		var datasize = NUMCHN * idx * 2;					// 16 bit samples -> 2 bytes per sample
		var rawwav = new RK002.RawBuf();
		
		rawwav.addString("RIFF");							// ChunkID
		rawwav.addUint32LE(36 + datasize);					// ChunkSize
		rawwav.addString("WAVE");							// Format
		rawwav.addString("fmt ");							// Subchunk1 ID
		rawwav.addUint32LE(16);								// Subchunk1 Size
		rawwav.addUint16LE(1);								// AudioFormat
		rawwav.addUint16LE(NUMCHN);							// Num channels
		rawwav.addUint32LE(AUDIOENC_FS);					// SampleRate
		rawwav.addUint32LE(AUDIOENC_FS * 4);				// ByteRate
		rawwav.addUint16LE(NUMCHN * 2);						// BlockAlign
		rawwav.addUint16LE(16);								// BitsPerSample
		rawwav.addString("data");							// Subchunk2 ID
		rawwav.addUint32LE(datasize);						// Subchunk2 Size
		
		for (var i=0; i<idx; i++)
		{
			for (var chn=0; chn<NUMCHN; chn++)
			{
				rawwav.addUint16LE(buf[i] ? 0x7fff : 0x8000);				
			}
		}
		
		var wavb64 = "data:audio/wav;base64," + base64.encode(rawwav.buf);
		
		return wavb64;
	}
	
	this.CRC8B = function(crc,dat)
	{
		/*
		 * CRC_POLYNOM = 0x9c;
		 * CRC_PRESET = 0xFF;
		 */

		var i;

		crc ^= dat;
		for (i = 0; i < 8; i++)
		{
		  if (crc & 0x01)
		  {
		      crc = (crc >> 1) ^ 0x9C;
		  }
		  else
		      crc = (crc >> 1);
		}

		return crc & 0xff;
	}
	
	this.encodeAudioPck = function(pck)
	{
		var i,d,crc,n = pck.length;
		
		this.clear();
		this.emitCarrier(AUDIOENC_LEADIN_MS);
		this.emitByte(0xAA);
		this.emitByte((n-1));
		crc = 0xff;

		for (i=0; i<n; i++)
		{
			// read from packet
			d = pck[i];
			crc = this.CRC8B(crc,d);
			
			this.emitByte(d);
			
			//console.log("emitting byte["+i+"] = "+d+"(0x"+d.toString(16)+")");
		}
		
		this.emitByte(crc);
		
		this.emitCarrier(AUDIOENC_LEADOUT_MS);
		
		return this.getAsWavBase64Str();
	}
	
}

/**************************************************************************//**
 * I/O drivers.
 ******************************************************************************/
RK002.OutputDrvAudio = function()
{
	this.txPck = function(pck)
	{
		var enc = new RK002.AudioEncoder();
		
		var wav = enc.encodeAudioPck(pck);
		
		var snd = new WaudSound(wav,{volume:1.0});
		
		snd.onLoad(function()
				{
					snd.play();
				});
	}
}

RK002.InputDrvMIDI = function(port, observer)
{
	this.observer = observer;
	
	this.port = port;
	
	this.disconnect = function()
	{
		this.port.onmidimessage = null;
	}
	
	this.port.onmidimessage = function(event)
	{
		//console.log("InputDrvMIDI.MIDI message received");
		
		if (observer && observer.onmidimessage)
		{
			observer.onmidimessage(event.data);
		}
		
/*
		
		var pck = RK002.sysexcodec.tryDecode(event.data, {
			
			onInquiryRSP : function(hwvs,swvs)
			{
				var hwvsstr = vstostr(hwvs);
				var swvsstr = vstostr(swvs);
				
				console.log("hndInquiryRSP(): hwvs="+hwvsstr+", swvs="+swvsstr);
				if (observer && observer.onInquiryRSP)
				{
					observer.onInquiryRSP(hwvsstr,swvsstr);
				}
			}
		});
*/		
	}
}


/**************************************************************************//**
 * some HEX tools.
 ******************************************************************************/
RK002.nibhex = function(v)
{
	v &= 0x0f;
	
	if (v<10)
	{
		return String.fromCharCode(48+v);
	}
	else
	{
		return String.fromCharCode(65+v-10);
	}
}

RK002.bytehex = function(v)
{
	return RK002.nibhex(v>>4) + RK002.nibhex(v);
}

RK002.uint32hex = function(v)
{
	return RK002.bytehex(v>>24) + RK002.bytehex(v>>16) + RK002.bytehex(v>>8) + RK002.bytehex(v);
}

RK002.dat2hexstr = function(v)
{
	var str = "";
	
	for (var i=0; i<v.length; i++)
	{
		if (i>32)
		{
			str += ".. ";
			break;
		}
		else
		{
			str += RK002.bytehex(v[i]);
			str += " ";
		}
	}
	
	return str;
}

RK002.OutputDrvMIDI = function(port)
{
	this.port = port;
	
	this.txPck = function(pck)
	{
		port.send(pck);

		if (RK002.dbg_rxtx_raw)
		{
			RK002.DBG("TX:("+pck.length+") "+RK002.dat2hexstr(pck));
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
RK002.dbg_t_last = null;

RK002.DBG = function(s)
{
	var t_now = Math.floor(performance.now());
	
	if (RK002.dbg_t_last == null)
	{
		RK002.dbg_t_last = t_now;
	}
	
	var t_diff = t_now - RK002.dbg_t_last;
	
	RK002.dbg_t_last = t_now;
	
	if (t_diff > 9999)
	{
		t_diff = 9999;
	}
	
	var txt_diff = "    "+t_diff;
	
	console.log(txt_diff.slice(-4) + " " + s);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
RK002.Info = function(data)
{
	var RK002INFOMAXSZ = 248;
	
	var pos = 0;
	
	this.magic = 0;
	this.date = "";
	this.name = "";
	this.author = "";
	this.version = "";
	this.guid = "";
	
	this.magic = RK002.read_uint32(data,pos);
	pos += 4;
	
	this.guid = RK002.read_string(data,pos,RK002INFOMAXSZ);
	pos += this.guid.length + 1;
	if (pos < RK002INFOMAXSZ)
	{
		this.date = RK002.read_string(data,pos,RK002INFOMAXSZ);	
		pos += this.date.length + 1;
		if (pos < RK002INFOMAXSZ)
		{
			this.name = RK002.read_string(data,pos,RK002INFOMAXSZ);
			pos += this.name.length + 1;
			if (pos < RK002INFOMAXSZ)
			{
				this.author = RK002.read_string(data,pos,RK002INFOMAXSZ);
				pos += this.author.length + 1;
				if (pos < RK002INFOMAXSZ)
				{
					this.version = RK002.read_string(data,pos,RK002INFOMAXSZ);
				}
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// RK002 loader.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
RK002.Loader = function()
{
	var self = this;
	
	var SIMPLEX_INITIAL_DELAY_MS					= 500;
	var SIMPLEX_CHUNK_TIMEOUT_SHORT_MS				= 100;
	var SIMPLEX_CHUNK_TIMEOUT_LONG_MS				= 400;
		
	var DUPLEX_DETECT_MAXRETRY						= 10;
	var DUPLEX_CHUNK_TIMEOUT_MS						= 400;
	var DUPLEX_CHUNK_MAXRETRY						= 4;
	
	var GET_NMB_PARAMS_TIMEOUT_MS					= 100;
	var GET_PARAM_TIMEOUT_MS						= 500;
	
	var DUPLEX_DETECT_MAXRETRY_VERY_FIRST_UPLOAD 	= 100;
	var DUPLEX_CRC_RESP_TIMEOUT_MS					= 100;
	var DUPLEX_JUMP_RSP_TIMEOUT_MS					= 100;
	
	var INQUIRY_PING_TIMEOUT_MS						= 100;
	var INQUIRY_MAXRETRY							= 5;
	var INQUIRY_RESULT_TIMEOUT						= -1;
	var INQUIRY_RESULT_LEGACY_INVALID				= 1;
	var INQUIRY_RESULT_DUY_INVALID					= 2;
	var INQUIRY_RESULT_DUY_VALID					= 3;
	var INQUIRY_RESULT_LEGACY_VALID					= 4;
	var INQUIRY_INFO_ADR							= 0x8c0;
	var INQUIRY_INFO_MAX_SZ							= 512;
	
	var BOOT1_PING_NMB_RETRIES						= 5;
	
	var MEMPAGESZ									= 64;

	var DUY_APP_MINSIZE								= 64*4;
	var DUY_APP_MAXSIZE								= 14*1024;
	
	var DUPLEX_LEGACY_UPDATEFW_RSP_TIMEOUT_MS		= 1000;
	
	var FLASH_SECTOR_SIZE							= 1024;
	
	var SYX_LEGACY_MEMCHUNKSZ						= 64;
	var SYX_MEMCHUNKSZ								= 64;
	
	var APP_FLASHADR								= 0x0800;
	var APP_RAMADR									= 0x10000000;
	var LEGACY_FLASHADR								= 8*1024;
	var APP_RK002SIZE_ADR							= (APP_FLASHADR + (6*4));
	var APP_CRCVAL									= 0x524B4832;		// 'RK02'
	
	var LEGACY_MINSIZE								= 64*4;
	var LEGACY_MAXSIZE								= 7*1024;
	var LEGACY_BOOTVECTOR_CRC						= 61;
	var LEGACY_BOOTVECTOR_BINARYSIZE				= 62;
	var LEGACY_BOOTVECTOR_FWINSTALLER				= 63;
	
	var UPLOADMODE_BOOTX							= 0;
	var UPLOADMODE_LEGACY							= 1;
	
	var MAINSTATE_IDLE								= 0;
	var MAINSTATE_MONITOR							= 1;
	var MAINSTATE_UNDUINIFY							= 2;
	var MAINSTATE_INQUIRY							= 3;
	var MAINSTATE_DUINIFY							= 4;
	var MAINSTATE_GETPARAMS							= 5;
	var m_mainstate = MAINSTATE_IDLE;
	
	var SUBSTATE_IDLE								= 0;
	var SUBSTATE_MONITOR							= 1;
	var SUBSTATE_INQUIRY							= 2;
	var SUBSTATE_UPLOAD								= 3;
	var SUBSTATE_EXPECT_UPDATE_FINAL_CRC			= 4;
	var SUBSTATE_EXPECT_BOOT1_RSP					= 5;
	var SUBSTATE_EXPECT_JUMP_RSP					= 6;
	var SUBSTATE_EXPECT_LEGACY_UPDATEFW_RSP			= 7;
	var SUBSTATE_GET_NMB_PARAMDEFS					= 8;
	var SUBSTATE_GET_PARAMDEFS						= 9;
	var SUBSTATE_GET_PARAMVALS							= 10;
	
	var m_substate = SUBSTATE_IDLE;
		
	var m_outputdrvaudio = new RK002.OutputDrvAudio(this);
	
	var m_inputdrv = null;
	var m_outputdrv = null;
	var m_observer = null;
		
	var m_last_sts_progress = -1;
	var m_last_sts_mainstr = null;
	var m_last_sts_substr = null;
	var m_last_sts_isok = false;
	
	var m_tmr = null;
	var m_retry;
	
	var m_t_last = null;
	
	var m_inquiry_rsp_mem = new Array(INQUIRY_INFO_MAX_SZ);
	
	var m_target_data;
	
	var m_upload_data;
	var m_upload_pos;
	var m_upload_des_adr;
	var m_upload_mode;
	var m_upload_chunksz;
	var m_upload_duplex;
	var m_upload_last_queued_flash_adr;
	
	var m_getparams_idx;
	var m_getparams_n;
	var m_params;
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.setObserver = function(o)
	{
		m_observer = o;
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.setOutputDriver = function(port)
	{
		if ((port == null) || (port.name == "disabled"))
		{
			m_outputdrv = null;
		}
		else
		if (port.name == "audio")
		{
			m_outputdrv = m_outputdrvaudio;
		}
		else
		{
			m_outputdrv = new RK002.OutputDrvMIDI(port);
			if(port.name=="RK005") RK002.rk005 = true; 
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.setInputDriver = function(port)
	{
		if (m_inputdrv != null)
		{
			m_inputdrv.disconnect();
		}
		
		if ((port == null) || (port.name == "disabled"))
		{
			m_inputdrv = null;
		}
		else
		{
			m_inputdrv = new RK002.InputDrvMIDI(port, self);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.onmidimessage = function(data)
	{
		if (RK002.dbg_rxtx_raw)
		{
			if (data[0] != 0xf8)
			{
				RK002.DBG("RX:("+data.length+") "+RK002.dat2hexstr(data));
			}
		}
		
		if (data[0] == 0xf0)
		{
			var pck = RK002.sysexcodec.tryDecode(data);
			
			if (pck != null)
			{
				onPck(pck);
			}
			else
			{
				RK002.DBG("RECEIVED UNKNOWN PACKET");
			}
		}
		
		//console.log("received pck",pck);
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var uiAddConsole = function(str)
	{
		RK002.DBG("uiaddconsole: "+str);
		if (m_observer && m_observer.rk002_consoleTxt)
		{
			m_observer.rk002_consoleTxt(str);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var queuePck = function(pck, timeout_ms=0)
	{
		var syxdat = RK002.sysexcodec.encodePck(pck);
		RK002.DBG("TX: "+RK002.sysexcodec.pckToString(pck));
		m_outputdrv.txPck(syxdat);
		setStateTmr(timeout_ms);
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var uiUpdateSts = function(progress,mainstr,substr,isok)
	{
		var notify = false;
		
		if (progress != m_last_sts_progress)
		{
			m_last_sts_progress = progress;
			notify = true;
		}
		
		if (mainstr != m_last_sts_mainstr)
		{
			m_last_sts_mainstr = mainstr;
			notify = true;
		}
		
		if (substr != m_last_sts_substr)
		{
			m_last_sts_substr = substr;
			notify = true;
		}
		
		if (isok != m_last_sts_isok)
		{
			m_last_sts_isok = isok;
			notify = true;
		}
		
		if (notify && (m_observer != null) && (m_observer.rk002_stsUpdate))
		{
			var str = mainstr;
			if ((substr != null) && (substr != ""))
			{
				str += " : ";
				str += substr;
			}
			
			m_observer.rk002_stsUpdate(progress, str, isok);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var setStateTmr = function(ms)
	{
		if (m_tmr != null)
		{
			clearTimeout(m_tmr);
			m_tmr = null;
		}
		
		if (ms != 0)
		{
			m_tmr = setTimeout(onStateTmr, ms);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var enterState = function(mainstate, substate, timeout_ms = 0)
	{
		m_mainstate = mainstate;
		m_substate = substate;
		setStateTmr(timeout_ms);
	}
	
	var enterSubState = function(substate, timeout_ms = 0)
	{
		enterState(m_mainstate,substate,timeout_ms);
	}
	
	var enterMonitorState = function(txt,success)
	{
		uiUpdateSts(100, txt, null, success);
		enterState(MAINSTATE_MONITOR,SUBSTATE_MONITOR);
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subOnBoot1Ready = function()
	{
		// OK BOOT1 is up & running now... what to do with it?
		switch (m_mainstate)
		{
			case MAINSTATE_UNDUINIFY:
				// start uploading the requested binary:
				subStartUpload("uploading target binary",m_target_data,LEGACY_FLASHADR,UPLOADMODE_BOOTX,true);
				break;
				
			default:
				enterMonitorState("upload done",true);
				break;
		}
	}
	
	var subEndUpload = function(txt, success)
	{
		enterMonitorState(txt,success);
		
		// notify the observer:
		if ( (typeof m_observer !== 'undefined')  && (typeof m_observer.rk002_onEndUpload !== 'undefined') ) 
		{
			var was_legacy = m_upload_des_adr == LEGACY_FLASHADR;
			m_observer.rk002_onEndUpload(txt,success,was_legacy);
		}
		subRK005SoftMode(1);
	}

	var queueMemChunkAndSetTimeout = function(ms)
	{
		var buf = new Uint8Array(m_upload_chunksz);
		for (var i=0; i<m_upload_chunksz; i++)
		{
			buf[i] = ((m_upload_pos + i) < m_upload_data.length) ? m_upload_data[m_upload_pos+i] : 0;
		}
		
		m_upload_last_queued_flash_adr = m_upload_des_adr + m_upload_pos;
		
		var pck = new RK002.Pck((m_upload_mode == UPLOADMODE_LEGACY) ? "legacy_writemem_req" : "writemem_req",
				{adr:m_upload_last_queued_flash_adr, data:buf});
		
		var progress = Math.floor((m_upload_pos * 99 / m_upload_data.length));
		uiUpdateSts(progress,m_last_sts_mainstr,""+progress+"\%",true);
		
		queuePck(pck);
		setStateTmr(ms);
	}
	
	var queueExecReq = function()
	{
		RK002.DBG("queueing EXEC packet");
		queuePck(new RK002.Pck("exec_req",{adr:m_upload_des_adr}));
	}
	
	var firstMemChunk = function()
	{
		m_retry = 0;
		enterSubState(SUBSTATE_UPLOAD);
		queueMemChunkAndSetTimeout(m_upload_duplex ? DUPLEX_CHUNK_TIMEOUT_MS : SIMPLEX_CHUNK_TIMEOUT_LONG_MS);
	}
	
	var retryMemChunk = function()
	{
		m_retry ++;
		if (m_retry < DUPLEX_CHUNK_MAXRETRY)
		{
			RK002.DBG("chunk retry #"+m_retry);
			queueMemChunkAndSetTimeout(DUPLEX_CHUNK_TIMEOUT_MS);
		}
		else
		{
			RK002.DBG("out of retries");
			subEndUpload("failed to write memory chunk",false);
		}
	}
	
	var nextMemChunk = function()
	{
		m_retry = 0;
		m_upload_pos += m_upload_chunksz;
		
		if (m_upload_pos < m_upload_data.length)
		{
			if (m_upload_duplex)
			{
				queueMemChunkAndSetTimeout(DUPLEX_CHUNK_TIMEOUT_MS);
			}
			else
			{
				queueMemChunkAndSetTimeout( ((m_upload_data_pos & (FLASH_SECTOR_SIZE-1)) == 0) ? SIMPLEX_CHUNK_TIMEOUT_LONG_MS : SIMPLEX_CHUNK_TIMEOUT_SHORT_MS);
			}
		}
		else
		{
			//
			// done uploading data
			//
			if (m_upload_duplex)
			{
				if (m_upload_mode == UPLOADMODE_LEGACY)
				{
					// execute FWUPD_REQUEST, and expect ACK
					RK002.DBG("queueing UPDATEFW_REQ");
					enterSubState(SUBSTATE_EXPECT_LEGACY_UPDATEFW_RSP);			
					queuePck(new RK002.Pck("legacy_updatefw_req"),DUPLEX_LEGACY_UPDATEFW_RSP_TIMEOUT_MS);
				}
				else
				{
					// ask for final checksum:
					enterSubState(SUBSTATE_EXPECT_UPDATE_FINAL_CRC);
					queuePck(new RK002.Pck("checksum_req",{adr:m_upload_des_adr,n:m_upload_data.length}),DUPLEX_CRC_RESP_TIMEOUT_MS);
				}
			}
			else
			{
				subEndUpload("upload OK",true);
			}
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subStartUpload = function(txt,data, desadr, mode, duplex)
	{
		uiUpdateSts(0,txt,null,true);
		m_upload_data = data;
		m_upload_des_adr = desadr;
		m_upload_pos = 0;
		m_upload_mode = mode;
		m_upload_duplex = duplex;
		m_upload_chunksz = (m_upload_mode == UPLOADMODE_LEGACY) ? SYX_LEGACY_MEMCHUNKSZ : SYX_MEMCHUNKSZ;
		firstMemChunk();
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subStartGetNmbParamDefs = function()
	{
		m_getparams_idx = 0;
		m_params = [];
		enterSubState(SUBSTATE_GET_NMB_PARAMDEFS);
		queuePck(new RK002.Pck("getnmbparams_req"),GET_NMB_PARAMS_TIMEOUT_MS);
	}
	
	var subEndGetParams = function(txt,success)
	{
		RK002.DBG(txt);
		enterMonitorState(txt,success);
		/*
		if (success)
		{
			RK002.DBG("fetched # params = " + m_params.length);
			for (var i=0; i<m_params.length; i++)
			{
				var p = m_params[i];
				
				RK002.DBG("param["+i+"] : min="+p.min+", max="+p.max+", def="+p.def+", flags="+p.flags+", lbl="+p.lbl);
			}
		}
		*/
	}
	
	var queueFetchGetParamDefReq = function(nr)
	{
		queuePck(new RK002.Pck("getparamdef_req",{param_nr:nr}), GET_PARAM_TIMEOUT_MS);
	}
	
	var queueFetchGetParamReq = function(param_nr)
	{
		queuePck(new RK002.Pck("getparam_req",{nr:param_nr}), GET_PARAM_TIMEOUT_MS);
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subEndInquiry = function(result,props)
	{
		var success = (result>0);
		RK002.DBG("subEndInquiry() inquiry_result="+result);
		
		switch (m_mainstate)
		{
			case MAINSTATE_INQUIRY:
				if (m_observer && m_observer.rk002_onInquiryResult)
				{
					m_observer.rk002_onInquiryResult(success,props);
				}
				
				// kick-start the binary again:
				queuePck(new RK002.Pck("exec_req",{adr:APP_FLASHADR}),0);

				enterMonitorState(success?"INQUIRY ready":"INQUIRY failed",success);
				break;
				
			case MAINSTATE_UNDUINIFY:
				switch (result)
				{
					case INQUIRY_RESULT_DUY_VALID:
					case INQUIRY_RESULT_DUY_INVALID:
						subStartUpload("uploading bootloader",RK002.boot1,APP_RAMADR,UPLOADMODE_BOOTX,true);
						break;
						
					case INQUIRY_RESULT_LEGACY_VALID:
						subStartUpload("uploading requested binary",m_target_data,LEGACY_FLASHADR,UPLOADMODE_LEGACY,true);
						break;
						
					default:
						enterMonitorState("failure inquiring cable",false);
						break;
				}
				break;
				
			case MAINSTATE_DUINIFY:
				switch (result)
				{
					case INQUIRY_RESULT_DUY_VALID:
					case INQUIRY_RESULT_DUY_INVALID:
						subStartUpload("uploading application",m_target_data,APP_FLASHADR,UPLOADMODE_BOOTX,true);
						break;
						
					case INQUIRY_RESULT_LEGACY_VALID:
						subStartUpload("uploading duinifier",RK002.duinify,LEGACY_FLASHADR,UPLOADMODE_LEGACY,true);
						break;
						
					default:
						enterMonitorState("failure inquiring cable",false);
						break;
				}
				break;
				
			default:
				throw "ending inquiry in unknown mainstate";
				break;
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subStartInquiry = function()
	{
		m_retry = 0;
		enterSubState(SUBSTATE_INQUIRY, INQUIRY_PING_TIMEOUT_MS);
		queueInquiryReq();
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var subRK005SoftMode = function(mode)
	{
		if(RK002.rk005){
			// mode= 1 soft on  / 0 = soft off
			var rk005_softthru_msg = [0xF0, 0x00, 0x21, 0x23, 0x00, 0x05, 0x03, 0x00, 0x01, mode, 0xF7];
			//                                                               |     |     |     |
			//                                                               |     |     |     +-- paramval = 0
			//                                                               |     |     +-------- paramidx = 1 (=DIN_SOFTTHRU)
			//                                                               |     +-------------- MSBs
			//                                                               +-------------------- cmd = SETPARAM
			m_outputdrv.txPck(rk005_softthru_msg);
		}
	}	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var queueInquiryReq = function()
	{
		subRK005SoftMode(0); //soft thru off	
		queuePck(new RK002.Pck("boot0_req"));
		queuePck(new RK002.Pck("legacy_inquiry_req"));
		queuePck(new RK002.Pck("readmem_req",{adr:APP_RK002SIZE_ADR}));
		setStateTmr(INQUIRY_PING_TIMEOUT_MS);
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var onPck = function(pck)
	{
		if (RK002.dbg_rxtx_pck)
		{
			RK002.DBG("RX: "+RK002.sysexcodec.pckToString(pck));
		}
		
		switch (m_substate)
		{
			case SUBSTATE_INQUIRY:
				if (pck.name == "checksum_rsp")
				{
					if (pck.crc32 == APP_CRCVAL)
					{
						// checksum is OK: continue with fetching INFO data:
						queuePck(new RK002.Pck("readmem_req",{adr:INQUIRY_INFO_ADR}),INQUIRY_PING_TIMEOUT_MS);
					}
					else
					{
						// checksum failed: maybe due to a aborted flash upload?
						// but we *have* received a CRC answer! -> so BOOT0 is active
						subEndInquiry(INQUIRY_RESULT_DUY_INVALID,{txt:"corrupted DUY application loaded on cable (bad crc)"});
					}
				}
				else
				if (pck.name == "readmem_rsp")
				{
					if (pck.adr == APP_RK002SIZE_ADR)
					{
						// OK: we received the stored length of the app
						var app_stored_size = RK002.read_uint32(pck.data,0);
						
						if ((app_stored_size > 0) && (app_stored_size < DUY_APP_MAXSIZE))
						{
							// now let the bootloader compute the checksum (which should be 0)
							queuePck(new RK002.Pck("checksum_req",{adr:APP_FLASHADR,n:app_stored_size}),INQUIRY_PING_TIMEOUT_MS);
						}
						else
						{
							// illegal size
							subEndInquiry(INQUIRY_RESULT_DUY_INVALID,{txt:"corrupted DUY application loaded on cable (bad size)"});
						}
					}
					else
					if ((pck.adr >= INQUIRY_INFO_ADR) && (pck.adr < (INQUIRY_INFO_ADR+INQUIRY_INFO_MAX_SZ)))
					{
						// OK: we received part of the inquiry info: store it 
						for (var i=0; i<MEMPAGESZ; i++)
						{
							m_inquiry_rsp_mem[i + pck.adr - INQUIRY_INFO_ADR] = pck.data[i];
						}
						
						// request more info?
						var nxtadr = pck.adr + MEMPAGESZ;
						if (nxtadr < (INQUIRY_INFO_ADR+INQUIRY_INFO_MAX_SZ))
						{
							queuePck(new RK002.Pck("readmem_req",{adr:nxtadr}),INQUIRY_PING_TIMEOUT_MS);
						}
						else
						{
							var info = new RK002.Info(m_inquiry_rsp_mem);
							if (info.magic == 0xCAFEBABE)
							{
								RK002.DBG("name    = "+info.name);
								RK002.DBG("author  = "+info.author);
								RK002.DBG("date    = "+info.date);
								RK002.DBG("version = "+info.version);
								RK002.DBG("guid    = "+info.guid);
								
								var props = {};
								props.is_legacy = false;
								props.name = info.name;
								props.author = info.author;
								props.date = info.date;
								props.version = info.version;
								props.guid = info.guid;
								
								subEndInquiry(INQUIRY_RESULT_DUY_VALID,props);
							}
							else
							{
								subEndInquiry(INQUIRY_RESULT_DUY_INVALID,{txt:"corrupted DUY application loaded on cable (bad_info)"});
							}
						}
					}
				}
				else
				if (pck.name == "legacy_inquiry_rsp")
				{
					var props = {};
					props.is_legacy = true;
					props.cabletype = pck.cabletype + " (" + RK002.cableTypeToString(pck.cabletype)+")";
					props.version = pck.svnstr;
					subEndInquiry(INQUIRY_RESULT_LEGACY_VALID,props);
				}
				break;
				
			case SUBSTATE_UPLOAD:
				if ((pck.name == "legacy_writemem_rsp") || (pck.name == "writemem_rsp"))
				{
					if ((pck.res == 0) && (pck.adr == m_upload_last_queued_flash_adr))
					{
						// received OK: continue with next chunk
						nextMemChunk();
					}
					else
					{
						RK002.DBG( "received bad response: res=" + pck.res + ", adr=0x" + RK002.uint32hex(pck.adr)
								+" (expected:" + RK002.uint32hex(m_upload_last_queued_flash_adr) + ")" );
						retryMemChunk();
					}
				}
				break;
				
			case SUBSTATE_EXPECT_UPDATE_FINAL_CRC:
				if (pck.name == "checksum_rsp")
				{
					var crc_computed = RK002.crc32(0,m_upload_data,0,m_upload_data.length);
					var crc_received = pck.crc32;
					if (crc_computed == crc_received)
					{
						RK002.DBG("final CRC check is OK");
						
						if (m_upload_data == RK002.boot1)
						{
							// we just uploaded BOOT1 binary:
							
							// expect boot1 response:
							enterSubState(SUBSTATE_EXPECT_BOOT1_RSP);
							
							// start BOOT1:
							queuePck(new RK002.Pck("exec_req",{adr:APP_RAMADR}),0);
							
							// queue BOOT1 ping:
							m_retry = 0;
							//queuePck(new RK002.Pck("boot1_req"), INQUIRY_PING_TIMEOUT_MS);
							setStateTmr(INQUIRY_PING_TIMEOUT_MS);
						}
						else
						{
							if (m_upload_des_adr == LEGACY_FLASHADR)
							{
								// just uploaded a legacy image through BOOTx protocol:
								enterSubState(SUBSTATE_EXPECT_JUMP_RSP);
								
								// execute direct JUMP to UPDATEFW routine inside legacy upload:
								var fwinstalleradr = RK002.read_uint32(m_upload_data,4*LEGACY_BOOTVECTOR_FWINSTALLER);
								fwinstalleradr += LEGACY_FLASHADR;
								RK002.DBG("executing jump to FWINSTALLER on legacy image at address 0x"+RK002.uint32hex(fwinstalleradr));
								enterSubState(SUBSTATE_EXPECT_JUMP_RSP);
								queuePck(new RK002.Pck("jump_req",{adr:fwinstalleradr}),DUPLEX_JUMP_RSP_TIMEOUT_MS);
							}
							else
							{
								// execute fresh binary:
								queuePck(new RK002.Pck("exec_req",{adr:m_upload_des_adr}),0);
								
								// and we're done
								subEndUpload("upload OK",true);
							}
						}
					}
					else
					{
						RK002.DBG("final CRC check fail (computed="+RK002.uint32hex(crc_computed)+",received="+RK002.uint32hex(crc_received)+")");
						subEndUpload("final CRC fail",false);
					}
				}
				break;
				
			case SUBSTATE_EXPECT_BOOT1_RSP:
				if (pck.name == "boot1_rsp")
				{
					// OK: BOOT1 is active now
					RK002.DBG("boot1 is running now");
					subOnBoot1Ready();
				}
				break;
				
			case SUBSTATE_EXPECT_JUMP_RSP:
				if (pck.name == "jump_rsp")
				{
					if (pck.res == 0)
					{
						subEndUpload("upload OK",true);
					}
					else
					{
						RK002.DBG("failure: received JUMP1_rsp with result code :"+pck.res);
						subEndUpload("failed to receive correct response",false);
					}
				}
				break;
				
			case SUBSTATE_EXPECT_LEGACY_UPDATEFW_RSP:
				if (pck.name == "legacy_updatefw_rsp")
				{
					if (m_mainstate == MAINSTATE_DUINIFY)
					{
						// start inquiry again:
						subStartInquiry();
					}
					else
					{
						subEndUpload("upload OK",true);
					}
				}
				break;
				
			case SUBSTATE_GET_NMB_PARAMDEFS:
				if (pck.name == "getnmbparams_rsp")
				{
					m_getparams_n = pck.n;
					if (m_getparams_n == 0)
					{
						// OK.. we're ready with fetching all param definitions
						// notify the observer:
						if ( (typeof m_observer !== 'undefined')  && (typeof m_observer.rk002_onParamDefsFetched !== 'undefined') ) 
						{
							m_observer.rk002_onParamDefsFetched(m_params);
						}
						
						subEndGetParams("params retreived OK", true);
					}
					else
					{
						// now we're going to fetch the paramdefs
						enterSubState(SUBSTATE_GET_PARAMDEFS);

						// queue fetch param:
						queueFetchGetParamDefReq(m_getparams_idx);
					}
				}
				break;
					
			case SUBSTATE_GET_PARAMDEFS:
				if (pck.name == "getparamdef_rsp")
				{
					if (pck.param_nr == m_getparams_idx)
					{
						
						// remember param definition:
						if (pck.min & 0x8000)
						{
							pck.min -= 65536;
						}
						
						m_params[m_getparams_idx] = 
						{
								nr : m_getparams_idx,
								min : pck.min,
								max : pck.max,
								def : pck.def,
								flags : pck.flags,
								lbl : pck.lbl,
								val : 0,
						};
							
						m_getparams_idx++;
						if (m_getparams_idx >= m_getparams_n)
						{
							// OK.. we're ready with fetching all param definitions
							// notify the observer:
							if ( (typeof m_observer !== 'undefined')  && (typeof m_observer.rk002_onParamDefsFetched !== 'undefined') ) 
							{
								m_observer.rk002_onParamDefsFetched(m_params);
							}
							
							// now we're going to fetch the param values
							enterSubState(SUBSTATE_GET_PARAMVALS);
							m_getparams_idx = 0;
							queueFetchGetParamReq(m_getparams_idx);
						}
						else
						{
							// queue fetch param:
							queueFetchGetParamDefReq(m_getparams_idx);
						}
					}
				}
				break;
				
			case SUBSTATE_GET_PARAMVALS:
				if (pck.name == "getparam_rsp")
				{
					if (pck.nr == m_getparams_idx)
					{
						m_params[m_getparams_idx].val = pck.val;
						
						m_getparams_idx++;
						if (m_getparams_idx >= m_getparams_n)
						{
							subEndGetParams("params retreived OK", true);
						}
						else
						{
							queueFetchGetParamReq(m_getparams_idx);
						}
					}
				}
				break;
				
			default:
				break;
		}
		
		if ((pck.name == "getparam_rsp") || (pck.name == "setparam_rsp"))
		{
			if ((typeof m_params !== 'undefined') && (pck.nr < m_params.length))
			{
				var val = pck.val;
				if (m_params[pck.nr].min < 0)
				{
					if (val & 0x8000)
					{
						val -= 65536;
					}
				}
				// store paramval:
				m_params[pck.nr].val = val;
				
				if ((typeof m_observer !== 'undefined')  && (typeof m_observer.rk002_onParam !== 'undefined'))
				{
					m_observer.rk002_onParam(m_params[pck.nr]);
				}
			}
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var onStateTmr = function()
	{
		RK002.DBG("onStateTmr()");
		switch (m_substate)
		{
			case SUBSTATE_MONITOR:
			default:
				break;
			
			case SUBSTATE_UPLOAD:
				if (m_upload_duplex)
				{
					RK002.DBG("timeout expecting duplex ack");
					retryMemChunk();
				}
				else
				{
					nextMemChunk();					
				}
				break;
				
			case SUBSTATE_EXPECT_JUMP_RSP:
				RK002.DBG("time-out receiving FWUPDATE response for legacy firmware");
				subEndUpload("timeout waiting for updatefw response",false);
				break;
				
			case SUBSTATE_EXPECT_UPDATE_FINAL_CRC:
				RK002.DBG("time-out receiving final CRC check");
				subEndUpload("timeout waiting for final CRC",false);
				break;
				
			case SUBSTATE_EXPECT_BOOT1_RSP:
				m_retry++;
				if (m_retry < BOOT1_PING_NMB_RETRIES)
				{
					queuePck(new RK002.Pck("boot1_req"), INQUIRY_PING_TIMEOUT_MS);
				}
				else
				{
					RK002.DBG("time-out receiving BOOT1 rsp");
					subEndUpload("timeout waiting for BOOT1 rsp",false);
				}
				break;
			
			case SUBSTATE_INQUIRY:
				m_retry++;
				if (m_retry < INQUIRY_MAXRETRY)
				{
					queueInquiryReq();
				}
				else
				{
					subEndInquiry(INQUIRY_RESULT_TIMEOUT,{txt:"inquiry operation time-out"});
				}
				break;
				
			case SUBSTATE_EXPECT_LEGACY_UPDATEFW_RSP:
				RK002.DBG("time-out waiting for legacy updatefw_rsp");
				subEndUpload("timeout waiting for response",false);
				break;
				
			case SUBSTATE_GET_NMB_PARAMDEFS:
			case SUBSTATE_GET_PARAMDEFS:
			case SUBSTATE_GET_PARAMVALS:
				subEndGetParams("time-out retreiving params",false);
				break;
				
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.startInquiry = function()
	{
		if (m_mainstate > MAINSTATE_MONITOR)
		{
			uiAddConsole("ERROR: operation in progress already");
			return;
		}
		
		if (!m_inputdrv)
		{
			uiAddConsole("ERROR: no input driver selected");
			return;
		}
		uiUpdateSts(0,"inquiring",null,true);
		
		m_mainstate = MAINSTATE_INQUIRY;
		subStartInquiry();
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var dataIsValidLegacyApp = function(data)
	{
		if (data.length < LEGACY_MINSIZE)
		{
			RK002.DBG("dataIsValidLegacyApp(): data.length too small");
			return false;
		}
		
		if (data.length > LEGACY_MAXSIZE)
		{
			RK002.DBG("dataIsValidLegacyApp(): data.length too big");
			return false;
		}
		
		var stored_size = RK002.read_uint32(data,LEGACY_BOOTVECTOR_BINARYSIZE*4);
		if (stored_size > data.length)
		{
			RK002.DBG("dataIsValidLegacyApp(): data.length mismatches with vector 62 (stored_size="+stored_size+", data.length="+data.length);
			return false;
		}
		
		var crc32_readback = RK002.read_uint32(data,LEGACY_BOOTVECTOR_CRC*4);
		var crc32_computed = RK002.crc32(0,data,0,stored_size);
		return crc32_readback == crc32_computed;
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.unDuinifyData = function(data)
	{
		if (m_mainstate > MAINSTATE_MONITOR)
		{
			uiAddConsole("ERROR: operation in progress already");
			return;
		}
		
		if (!m_inputdrv)
		{
			uiAddConsole("ERROR: no input driver selected");
			return;
		}
		
		uiUpdateSts(0,"unduinifying",null,true);
		
		// is it a legacy image?
		if (dataIsValidLegacyApp(data))
		{
			// remember data
			m_target_data = data;
			
			// now start inquirying:
			m_mainstate = MAINSTATE_UNDUINIFY;
			uiUpdateSts(0,"unduinifying",null,true);
			subStartInquiry();
		}
		else
		{
			uiAddConsole("ERROR: file is not a valid RK002 binary");
			uiUpdateSts(100,"unduinify failed",null,false);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.unDuinifyFile = function(filename)
	{
		var req = new XMLHttpRequest();
		req.open("GET", filename, true);
		req.responseType = "arraybuffer";
		req.onloadend = function()
		{
			RK002.DBG("req.status="+req.status);
			
			if (req.status == 200)
			{
				// load OK:
				var data = new Uint8Array(this.response);
				RK002.DBG("load OK: size="+data.length);
				self.unDuinifyData(data);
			}
			else
			{
				uiAddConsole("ERROR: failed to fetch binary data");
				uiUpdateSts(100,"unduinify failed",null,false);
			}
		}
		req.send();
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.unDuinifySMF = function(smfdata)
	{
		// data is Uint8Array
		RK002.DBG("decoding MIDI file ! ("+smfdata.length+" bytes)");
		
		decodeSMF(smfdata.buffer);
		
		var flashmem = new Uint8Array(LEGACY_MAXSIZE);
		var highest_adr = 0;
		
		var track = midiFile.tracks[0];
		for (var j=0;j<track.events.length;j++) 
		{
			var ev = track.events[j];
			
			console.log("ev.type="+ev.type);

			if (ev.type == "sysex") 
			{
				var d = ev.metaData;
				
				RK002.DBG("SMF: RX:("+d.length+") "+RK002.dat2hexstr(d));
				
				var syxdat = new Uint8Array(d.length);
				syxdat[0] = 0xf0;
				for (var i=0; i<d.length-2; i++)
				{
					syxdat[1+i] = d[2+i];
				}

				var pck = RK002.sysexcodec.tryDecode(syxdat);
				
				if (pck != null)
				{
					RK002.DBG("SMF: pck="+RK002.sysexcodec.pckToString(pck));
					if (pck.name == "legacy_writemem_req")
					{
						if ((pck.adr >= LEGACY_FLASHADR) && (pck.adr < (LEGACY_FLASHADR+LEGACY_MAXSIZE)))
						{
							var adr = pck.adr - LEGACY_FLASHADR;
							
							for (var i=0; i<64; i++)
							{
								flashmem[adr++] = pck.data[i];
							}
							if (adr > highest_adr)
							{
								highest_adr = adr;
							}
						}
					}
				}
			}
		}
		
		if (highest_adr > 0)
		{
			flashmem = flashmem.slice(0,highest_adr);
			self.unDuinifyData(flashmem);
		}
		else
		{
			uiAddConsole("ERROR: midifile doesn't contain RK002 firmware");
			uiUpdateSts(100,"upload failed",null,false);
		}
		
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var dataIsValidDuyApp = function(data)
	{
		if (data.length < DUY_APP_MINSIZE)
		{
			RK002.DBG("dataIsValidDuyApp(): data.length too small");
			return false;
		}
		
		if (data.length > DUY_APP_MAXSIZE)
		{
			RK002.DBG("dataIsValidDuyApp(): data.length too big");
			return false;
		}
		
		var crc32_computed = RK002.crc32(0,data,0,data.length);
		
		return crc32_computed == APP_CRCVAL;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.duinify = function(data)
	{
		// data should be a Uint8Array
		
		if (m_mainstate > MAINSTATE_MONITOR)
		{
			uiAddConsole("ERROR: operation in progress already");
			return;
		}
		
		if (!m_inputdrv)
		{
			uiAddConsole("ERROR: no input driver selected");
			return;
		}
		
		if (dataIsValidDuyApp(data))
		{
			// remember data
			m_target_data = data;
			
			// now start inquirying:
			m_mainstate = MAINSTATE_DUINIFY;
			uiUpdateSts(0,"duinifying",null,true);
			subStartInquiry();
		}
		else
		{
			uiAddConsole("ERROR: file is not a valid RK002 binary");
			uiUpdateSts(100,"duinify failed",null,false);
		}
	}
		
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.fetchParams = function()
	{
		if (m_mainstate > MAINSTATE_MONITOR)
		{
			uiAddConsole("ERROR: operation in progress already");
			return;
		}
		
		if (!m_inputdrv)
		{
			uiAddConsole("ERROR: no input driver selected");
			return;
		}
		
		m_mainstate = MAINSTATE_GETPARAMS;
		uiUpdateSts(0,"retreiving prameters",null,true);
		subStartGetNmbParamDefs()
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.getParamDef = function(param_nr)
	{
		if ((typeof m_params !== 'undefined') && (param_nr < m_params.length))
		{
			return m_params[param_nr];
		}
		
		return null;
	}
		
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	this.setParamVal = function(param_nr, param_val)
	{
		if (m_mainstate > MAINSTATE_MONITOR)
		{
			uiAddConsole("ERROR: operation in progress already");
			return;
		}
		
		queuePck(new RK002.Pck("setparam_req",{nr:param_nr, val:(param_val&0xffff)}));
	}
}

/* eslint-enable */

// js module
export default RK002
