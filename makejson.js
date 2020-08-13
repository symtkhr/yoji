// Type "node makejson.js" to use

var table = {
    uni:[],
    merge_row: (index, k, ref, mergeword) => {

        if (ref == "meanx") return;
        var u = table.uni[index];

        // merge URL
        if (!u[ref] || u[ref].indexOf(k.path) == -1) {
            if (u[ref])
                u[ref] += ";" + k.path;
            else
                u[ref] = k.path;
            console.log(ref + ":path", u[ref], u.word, u.id);
        }

        if (mergeword) {

            console.log(ref + ":word", u.id, JSON.stringify(u.sword), JSON.stringify(k));
            //u.word.push(ref + ":" + k.word;)

            return;
        }
        
        // merge read
        if (k.read && !u.sread.some(r => conv.hira(r) == conv.hira(k.read))) {
            console.log(ref + ":read", u.id, JSON.stringify(u.sread), JSON.stringify(k));
            //u.read.push(ref + ":" + k.read);
        }

    },

    append_row: (r, w, p, ref, other) => {
        var obj = {
            word: [w],
            read: [r],
            [ref]: p,
        };
        
        if (other) 
            Object.keys(other).forEach(key => obj[key] = other[key]);
        console.log(ref + ":append", JSON.stringify(obj));
        if (ref ==  "dkw" || ref == "meanx") table.uni.push(obj);
    },
};

String.prototype.toKatakana = function() {
    return this.replace(/[ぁ-ゖ]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));
};

var conv = {
    hira: (s) => s.toLowerCase()
        .replace(/[ァ-ヶ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60))
        .split("").filter(c => "「」『』/*#1234y:;+".indexOf(c) == -1).join(""),

    seion: (a) => conv.hira(a).split("").map(c => {
        var n = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ".indexOf(c);
        if (n < 0) return c;
        return "かきくけこさしすせそたちつてとはひふへほはひふへほやゆよつ".slice(n, n + 1);
    }).join(""),

    kata: s => s.toKatakana(),
};

var same = (a, b) => {
    var b0 = conv.hira(b);
    var a0 = conv.hira(a[0]);
    if (a0 == b0) return true;
    if (a.length <= 1) return false;
    a.slice(1).join("」").split("』").join("」").split("」").map(v => conv.hira(v))
        .forEach(a => { if (a!="") b0 = b0.split(a).join(";");});
    var ret = b0.split(";").every(b => a0.indexOf(b) != -1);
    return ret;
};

var make_word_var = (vword) => {
    if (vword.length == 1) return vword;
    
    // make variation table
    var ret = [vword[0]];
    vword.slice(1).forEach(w => {
        w = w.split("?").join("");
        var m = w.match(/^([1-4]+):(.+)$/);
        if (m) {
            m[1].split("").map(p => {
                p = p - 1;
                var rep = Array.from("*".repeat(p) + m[2]);
                var add = ret.map(w0 => Array.from(w0).map((c,i) => (p <= i && rep[i]) ? rep[i] : c).join(""));
                //console.log(p,rep,ret, add);
                ret = ret.concat(add);
            });
            return;
        } 
        var m = w.match(/^([1-4]+)=>?(.)/);
        if (m) {
            m[1].split("").map(p => {
                p = p - 1;
                var rep = Array.from("*".repeat(p) + m[2]);
                var add = ret.map(w0 => Array.from(w0).map((c,i) => (p <= i && rep[i]) ? rep[i] : c).join(""));
                //console.log(p,rep,ret, add);
                ret = ret.concat(add);
            });
            return;
        } 

        //hoge();
        if (Array.from(w).length == 4)
            ret.push(w);
        else
            console.log(vword);
        
    });
    return [... new Set(ret)];
    
};

var make_read_var = (vread) => {
    if (vread.length == 1) return vread;
    
    // make variation table
    var ret = [vread[0]];
    vread.slice(1).forEach(r => {
        r = r.split("?").join("").split("#").join("");
        var m = r.match(/^([1-4+]+):(.+)$/);
        if (m) {
            var is_plus = (m[1].slice(-1) == "+");
            
            m[1].split("").filter(v => v != "+").map(p => {
                p = parseInt(p) - 1;
                var rep = ("_/".repeat(p) + m[2]).split("/");
                var add = ret.map(r0 => r0.split("/").map((c,i) => (p <= i && rep[i]) ? (is_plus ? (c + rep[i]) : rep[i]) : c).join("/"));
                //if(vread[0].match(/^アン.エイ/))console.log(is_plus,p,rep,ret, add);
                ret = ret.concat(add);
            });
            return;
        } 
        //hoge();
        if (r.split("/").length == 4)
            ret.push(r);
        else
            console.log(vread);
        
    });
    return [... new Set(ret)];
};


Array.prototype.flat = function() {
    return [].concat(...this)
};
//console.log([[1,3],2,4,[5,7]].flat());

var duplicate_check = () => {
    if (!table.uni[0].sword) {
        console.log("[error] need sword");
        return;
    }

    var ret = table.uni.map(v => v.sword).filter(v=>v).flat();
    var dup = ret.filter((v,i,self) => self.indexOf(v) === i && i !== self.lastIndexOf(v));
    var dups = table.uni.filter(v => v.sword && v.sword.some(w => dup.indexOf(w) != -1));
    dups.sort((a,b) => a.read[0] < b.read[0] ?  -1 :1);
    console.log(dups.map(v => JSON.stringify(v)));

};

var similar_check = () => {
    if (!table.uni[0].sword) {
        console.log("[error] need sword");
        return;
    }
    var similar = (x,y) => {
        var ys = Array.from(y);
        var common = Array.from(x).filter(cx => {
            var i = ys.indexOf(cx);
            //console.log(ys,cx);
            if (i < 0) return false;
            ys.splice(i,1);
            return true;
        });
        return (4 <= common.length) && [common, ys];
    };

    var ret = [];
    table.uni.map(v => {ret = ret.concat(v.sword.map(w => [v.id,w]));});
    ret = table.uni.map(v => [v.id,v.word[0]]);
    //console.log(ret);
    var dumpref = v => ["yji","dkw","wp","goo","kk","kb"].filter(key => v[key]);
    var dup = table.uni
        //.filter(v=> !v.kk && !v.kb && !v.dkw && !v.yji && !v.goo && !v.meanref)
        .filter(v=>  !v.meanref)
        .forEach((v,i,self) => {
        var rep = v.word[0].slice(2,4) + v.word[0].slice(0,2);
            if (!v.meanref) v.meanref = "-";
            //if(v.word[0].indexOf("圃")>=0) console.log(v.word);
        var vf = table.uni.filter(
            v2 =>
//                (v.id < v2.id) &&
                (v2.word[0] != rep) &&
                (v.meanref != v2.meanref) &&
                (v.meanref != v2.word[0]) &&
                (v2.meanref != v.word[0]) &&
                similar(v.word[0],v2.word[0])
        );
            //if (vf.length) console.log(v.word[0],vf.map(v => v.word));
            if (!vf.length) return;
            console.log(v.word[0],dumpref(v));
            vf.map(v => console.log(v.word[0],dumpref(v)));
            console.log("---");
    });
    //console.log(dup);
}

Array.prototype.uniq = function() {
    var array = this;
    return Array.from(new Set(array));
};
var check_inconsistent_variants = () => {

    var vartable = table.uni.filter(v => v.word.slice(1).some(w => 1 < w.length))
        .map(v => {
            var w0 = Array.from(v.word[0]);
            return v.word.slice(1).map(w => {
                if (w.indexOf("?") != -1) return;
                var m = w.match(/^([1-4]+):(.+)$/);
                if (!m) return;
                var p = m[1].slice(0,1) - 1;
                var rep = m[2];
                return w0.slice(p, Array.from(rep).length + p).join("") + ":" + rep;
            }).filter(v => v);
        }).flat().sort((a,b) => (a[0] < b[0] ? -1:1)).uniq()
        .map(v => v.split(":"));


    console.log(JSON.stringify(vartable));

    table.uni.map(v => {
        var ret = vartable.filter(x => v.word[0].indexOf(x[0])!=-1 || v.word[0].indexOf(x[1])!=-1)
            .filter(x => {
                var w = v.word.slice(1).join(";")
                return w.indexOf(":" + x[0])==-1 && w.indexOf(":" + x[1])==-1;
            });
        if (ret.length == 0) return;
        console.log(v.word, ret);
        //ret.filter()
        //v.word.slice(1).forEach(w => w.indexOf(":"+ret[]))
    });
};

var itaiji_dump = () => {
    var ret = {};
    table.uni.filter(v => v.word[1] && v.word[1].indexOf("「") != -1)
        .sort((a,b) => a.word[1] < b.word[1] ? -1 : 1)
        .forEach(v => {
            var cs = v.word[1].replace(/『.+?』/g, "");
            cs.split("」").forEach(c => {
                if (c == "") return;
                c = c.replace(/^「/, "");
                if (!ret[c]) ret[c] = [];
                ret[c].push(v.word[0]);
            });
        });
    var pairs = Object.keys(ret).map(c => {
        var words = ret[c];
        if (words.length == 1) return [c, words[0]];
        var cs = Array.from(words[0]).filter(c => words.every(w => w.indexOf(c) != -1));
        return cs.length ? [c, cs] : [c, words];
    });
}
    

var Itaiji = function() {
    this.rep = [...new Set([
        "仭=仞","侭=儘","侠=俠","倶=俱","兔=兎","鳬=鳧","龜#=亀","冰=氷","壷=壺","凛=凜","厦=廈","廚=厨","呑=吞","剥=剝","呍=吽","唖=啞","噛=嚙",
        "嚢=囊","堯#=尭","填=塡","妍=姸","艷#=艶","屏=屛","屭=屓","巖#=巌","并=幷","彌#=弥","慚=慙","掻=搔","昿=曠","彌#=弥","覊=羈","曾=曽",
        "涌=湧","涛=濤","渕=淵","溌=潑","濶=闊","烟=煙","焔=焰","煕#=熙","瑤#=瑶","畴=疇","瘦#=痩","躯=軀","眦=眥","砺=礪","礙=碍","祷=禱","箪=簞","篭=籠",
        "箪=簞","絏=紲","繍=繡","繋=繫","纒=纏","脣=唇","莱=萊","薀=蘊","蝿=蠅","蝉=蟬","諌=諫","譛=譖","讎=讐","豬=猪","賎=賤",
        //"迹=跡",
        "躙=躪","躯=軀","輭=軟","迩=邇","遙#=遥","鈎=鉤","頬=頰","顛=顚","飜=翻","餠#=餅","鴬=鶯","鴎=鷗","麪=麺","麵#=麺","鼃=蛙",
    "叱=𠮟","麁=麤","讚#=讃","燈=灯",
    ])].map(r => r.split("="));
}

Itaiji.prototype.check = function (w, is_yure) {

    if (is_yure) {
        return this.rep.map(r => [w.indexOf(r[1])+1, r[0]]).filter(v => v[0]);
    }
    
    this.rep.forEach(r => {
        var minor = r[0].split("#").shift();
        if (w.indexOf(minor) == -1) return;
        w = w.split(minor).join(r[1]);
    });
    return w;

    table.uni.map(v => {
        rep.forEach(r => {
            var minor = conv.hira(r[0]);
            if (v.word[0].indexOf(minor) == -1) return;
            v.word.push(r[0]);
            v.word[0] = v.word[0].split(minor).join(r[1]);
            console.log(v);
        });
        return v;
    });
};

var itaiji = new Itaiji();

var resort = (way) => {
    if (way == "kanasort")
        return table.uni.sort((a,b) => conv.seion(a.read[0]) < conv.seion(b.read[0]) ? -1 : 1);
    if (way == "hansort")
        return table.uni.sort((a,b) => a.word[0] < b.word[0] ? -1 : 1);
    table.uni.sort((a,b) => a.id - b.id);
};

var word_yure_format = () => {
    table.uni.map(v => {
        if (v.word.length == 1) return v;
        v.word = v.word.map(w => itaiji.check(w));
        var headword = v.word[0];
        var yure = v.word.slice(1).join(",").split("』").join(",").split("」").join(",").split(",").filter(v => v);
        yure = yure.map(y => {
            if (y.slice(0,1)=="「") {
                var c = y.split("「").join("").split("*").join("").split("#").join("");
                return (headword.indexOf(c) < 0) ? ("=>" + c) : "";
            }
            if (y.slice(0,1)=="『") {
                var ys = Array.from(y.slice(1));
                if (ys.length == 4) return y.slice(1);
                var ws = Array.from(headword);
                // ys = Ab & headword = abcd
                //console.log(ys, ws);
                var n = ys.findIndex(c => ws.indexOf(c) != -1);
                if (n == -1) { return ("@@"+y.slice(1)); }
                if (ws.filter(c => c == ys[n]).length > 1) { return "@@:" + y.slice(1); }
                var p = ws.indexOf(ys[n]) - n;
                return (p+1) + ":" + y.slice(1);
            }
            if (y.slice(0,2)=="y:") {
                var ys = Array.from(y.slice(2)).map((c,i,self) => c=="々" ? self[i-1]:c);
                var ws = Array.from(headword);
                var ys0 = ys.slice(0,2).join("");
                var ys1 = ys.slice(2,4).join("");
                var ret = [];
                if (ys0 != ws.slice(0,2).join("")) ret.push("1:"+ys0);
                if (ys1 != ws.slice(2,4).join("")) ret.push("3:"+ys1);
                return ret.join(",");
            }
            //console.log("something?", y);
            return y;
        });
        yure = yure.join(",").split(",?").join("?");
        //yure += "," + itaiji.check(v.word[0], true).map(v => v.join("=")).join(",");
        yure = [...new Set(yure.split(","))].sort().filter(v => v);
        yure.unshift(v.word[0]);
        v.word = yure;
        return v;
    });

};

var read_format_onkun = (r) => {
    if (!r) return;
    var i = r.findIndex(v => v.match(/^[a-z\?\/]+$/));
    if (i < 0) {
        r[0] = r[0].split("/").map((c,i) => conv.kata(c) ).join("/");
    } else {
        var css = r[i].split("/");
        r.splice(i, 1);
        
        r[0] = r[0].split("/").map((c,i) => {
            if (css[i].length == 0) c = conv.kata(c);
            else if ("abpos".indexOf(css[i])==-1) console.log(r);
            
            if (css[i] == "a") c = c.slice(0, -1).toKatakana() + c.slice(-1);
            if (css[i] == "b") c = c.slice(0, -2).toKatakana() + c.slice(-2);
            if (css[i] == "s") c = c+"*";
            return c;
        }).join("/");
    }

    return r;
};

var read_check_yomikudashi = () => {
    //読み下し文をマーク
    //"1007:奇貨可居;1388:君子不器;"
    ("1687:後生可畏;2451:渉于春氷;1389:君子懐徳;2685:不通水火;1390:君子慎独;2582:如臨深渕;3229:非地中物;3760:如履薄氷;2795:坐井観天;439:魚游釜中;1379:車如流水;"
     +"1834:心如涌泉;3066:河漢其言;4316:以水投石;4317:以水減火;438:如魚得水;2859:用銭如水;3697:述而不作;4315:水滴穿石;4318:以水救水;4505:以湯沃雪;4782:吾唯知足")
        .split(";").forEach(v => {
            var id = parseInt(v.split(":").shift());
            var i = table.uni.findIndex(v => id == v.id);
            table.uni[i].read[0] += "#";
        });
};


var read_yure_format = (table) => {
    //subreading check
    table.map(v => {
        if (v.read.length == 1) return v;
        if (v.read.length > 2) console.log(v);
        var r0 = v.read[0].split("/").map(v => conv.hira(v));

        v.read[1] = v.read[1].split("』").join("」").split("『").join("「");
        v.read[1] = v.read[1].split("」").filter(v => v.length).map(r => {
            var tail = "";
            if (r.indexOf("//")==0) {r = r.slice(2); tail="??"; };
            if (r.indexOf("「")==0) r = r.slice(1);
            var rs = r.split("/").filter(v => v.length);
            if (rs.length == 1) {
                if (rs[0].indexOf("2+") != -1) return rs[0] + "」" + tail;
                else
                    console.log("detect", rs, v.word);
                return "no「" + rs[0] + "」" + tail;
            }
            // compare <ABCD> vs <Ab> or <aB> or <Cd> or <cD>
            var idx = -1;
            var i = rs.findIndex(cr => {
                idx = r0.indexOf(cr);
                return (idx != -1);
            });
            if (idx == -1 || idx-i<0||idx - i + rs.length > 4)
                return "no「" + rs.join("/") + "」"+tail;
            //console.log("not found", v.word, v.read[0], rs);

            var s = (idx - i);
            var r1 = v.read[0].split("/");
            //console.log(r0,rs,s);
            rs = rs.map((r,i)=>(r1[i+s].match(/[ァ-ヶ]/) ? r.toKatakana():r));
            //console.log(r0,rs,s);
            return (s+1) + "「" + rs.join("/") + "」"+tail;
        }).join(";");
        return v;
    });

}

var read_yure_format = (table) => {
    //subreading check
    table.map(v => {
        if (v.read.length == 1) return v;
        var r0 = v.read[0].split("/").map(v => conv.hira(v));

        var yure = v.read[1].split(";").filter(v => v.length).map(r => {
            if (r.slice(0,2) == "y:") {

                // ToDo: suggest
                return r;
            }
            var ts = r.split("「");
            if (ts.length != 2) {
                console.log(v.word, v.read, r);
                return r;
            }
            if (ts[0].match(/^[1-4]/)) {
                return ts[0] + ":" + ts[1];
                //var rs = r.split("/").filter(v => v.length);
                //return r;
            }
            
            console.log(v.word, v.read, r);
            return r;
        });
        console.log(v.read, yure);
        return v;
    });
}



var reading_list = (table) => {
    var dicts = {};
    table.forEach(v => {
        v.read.forEach((vread, i) => {
            if (vread.slice(-1) == "#") return;
            if (i != 0) {
                var r = vread.split(":");
                if (r.length != 2) return;
                if (!r[0].match(/^[1-4]$/)) return;
                var x = r.shift() - 1;
                //console.log(r);
                r = r[0].split("/");
                if (4 < r.length + x) return;
                r = r.map(r0 => r0.replace(/^([ァ-ヶ]+)[のは1-9]$/, "$1").split("?").join(""));
                var w = Array.from(v.word[0]);
                w.forEach((c,i)=> {
                    if (i < x) return;
                    if (!dicts[c]) dicts[c] = {};
                    if (!r[i-x]) return;
                    var read0 = r[i-x];
                    if(read0.indexOf("*") != -1) return;
                    if (!dicts[c][read0]) dicts[c][read0] = 0;
                    dicts[c][read0]++;
                });
                return;
            }
            var r = vread.split("/");

            if(r.length < 4) return;
            r = r.map(r0 => r0.replace(/^([ァ-ヶ]+)[のは]$/, "$1").replace(/[0-9]$/, ""));
            //console.log(v);
            var w = Array.from(v.word[0]);
            w.forEach((c,i)=> {
                if (r[i].indexOf("*") != -1) return;
                if (!dicts[c]) dicts[c] = {};
                if (!dicts[c][r[i]]) dicts[c][r[i]] = 0;
                dicts[c][r[i]]++;
            });
        });
    });
    Object.keys(dicts).forEach(c => {
        dicts[c] = Object.keys(dicts[c]).map(v => {return {r:v, n:dicts[c][v]}; });
        dicts[c].sort((a,b) => {
            var bk = (b.r.match(/[ァ-ヶ]/));
            var ak = (a.r.match(/[ァ-ヶ]/));
            if (bk && !ak) return 1;
            if (ak && !bk) return -1;
            return (b.n - a.n);
        });
    });
    return dicts;
};



var replaceable_check = (table) => {
    //replaceable check
    var ws = table.map(v => v.sword).flat();
    table = table.map(v => {
        if (v.replaceable) return v;
        var rep = v.word[0].slice(2,4) + v.word[0].slice(0,2);
        if (rep == v.word[0]) return v;
        if (ws.some(w => w == rep)) {
            v.replaceable = true;
            console.log(rep);
        }
        return v;
    });
    return;
    
    //replaceable base
    return table.map(v => {
        if (!v.replaceable) return v;
        //if (v.mean != "") return v;
        var rep = v.word[0].slice(2,4) + v.word[0].slice(0,2);
        if (rep == v.word[0]) { delete v.replaceable; return v; }
        var vr = table.find(x => x.word[0] == rep);
        if (!vr) return v;
        var a = b = 0;
        if (v.kk) a++;
        if (v.goo) a++;
        if (vr.kk) b++;
        if (vr.goo) b++;
        if (b <= a) {
            //console.log(a,b,v, vr);
            return v;
        }
        if (v.mean == "?") v.mean = "";
        if (v.mean == "⇒") v.mean = "";
        var ret = Array.from(new Set([v.mean, "⇒" + rep])).filter(v => v != "");
        v.mean = ret.join("((");
        //if (ret.length != 1) console.log(v);
        //console.log(v);
        return v;
    });
};


var analyze = (table) => {
    //reading list
    var dicts = reading_list(table);

    // manually appended
    "待:まち;両:もろ;剣:つるぎ;河:かわ;勝:かつ;臭:ぐさ;場:ば;齢:よわい;嶺:ね;息:むす;屋:や;座:ぐら;寸:き;片:ひら;枝:えだ;引:びき;岩:いわ;仲:なか;秋:じゅうの;操:みさお;秋:とき;左:と;右:こう;栗:くり;戸:と;刃:は;半:なか;文:も;種:たね;五:い;我:わが;双:ふた;梃:てこ;葉:ば;等:ら;針:はり;灰:はい".split(";").forEach(v => {
        var t = v.split(":");
        if (!dicts[t[0]]) dicts[t[0]] = [];
        dicts[t[0]].push({n:1,r:t[1]});
    });

    "梯:てい;般:はん;四:シイ;食:ショッ;露:ろう;桟:さん;珊:さん;飯:ばん;去:こ;粧:しょう;溝:こう;思:さい;行:あん;怪:け;慊:けん;膏:ごう;文:もん;窕:ちょう;番:は;個:こ;悔:げ;了:りょう;弐:じ;灌:かん;輝:き;墓:ぼ;恵:え"
    
    var xpa = ("瞑:めい;譚:だん;椒:しょう;検:けん;鷙:し;鷹:おう;袍:ぽう;嘩:か;功:く;瑠:る;璃:り;法:はっ;滂:ぼう;熱:ねっ;溶:よう;悔:け;器:ぎ;鞦:しゅう;陥:かん;目:ぼく;籌:ちゅう;蓼:りく;也:や;踉:ろう;蹌:そう;剥:はく;螽:しゅう;飄:ひょう;怜:れい;緋:ひ;権:ごん;稜:りょう;晶:しょう;葭:か;弘:ぐ;斯:し;庚:こう;桴:ふ;句:こう;偲:し;懐:がい;嗷:ごう;忽:こつ;螽:しゅう;汨:こつ;等:と;漾:よう;灯:どう;畢:ひつ;兄:きょう;錯:しゃく;刺:せき;衣:ね;栄:え")
    //console.log(xpa);
    xpa.split(";").forEach(v => {
        var t = v.split(":");
        if (!dicts[t[0]]) dicts[t[0]] = [];
        dicts[t[0]].push({n:1,r:t[1].toKatakana()});
    });
    Object.keys(dicts).forEach(c => {
        dicts[c].sort((a,b) => {
            if (a.r !="の" && a.r.slice(-1) == "の") return 1;
            if (b.r !="の" && b.r.slice(-1) == "の") return -1;
            var d = (b.r.length - a.r.length);
            if (d) return d;
            return b.n - a.n;
        });
    });

    console.log("suggest_read_splitter");
    var suggest_read_splitter = (word, read) => {
        var w = word.split("");
        var rfs = [conv.hira(read)];
        var ret = w.map(c => {

            var dicr = dicts[c];
            if (!dicr) { return; }
            var rfb = rfs.pop();
            var dic = dicr.find(v => v.r.length && (conv.hira(v.r)  == rfb.slice(0, v.r.length)))
                || dicr.find(v => rfb.indexOf(conv.hira(v.r)) != -1);
            if (!dic) { rfs.push(rfb); return; }
            rfs = rfs.concat(rfb.replace(conv.hira(dic.r), "!").split("!"));
            return dic.r;
        });

        var check = (read, ret) => {
            if (ret.filter(v => v).length != 4) return false;
            if (conv.hira(ret.join("")) != conv.hira(read)) return false;
            read = ret.join("/");
            return true;
        };

        //console.log("kekka*" ,read, ret);
        if (check(read, ret)) return ret.join("/");
        //var rfs = rf.split("/");
        if (rfs.length == 4) {
            if (true || ret.every((v, i) => (v && rfs[i].length == 0) || (!v && rfs[i].length))) {
                ret = ret.map((v, i) => v ? (v + rfs[i]) : rfs[i].toKatakana());
                //rfs.forEach((r,i)=> {if(r.length) console.log(r, w[i])});
                if (check(read, ret)) return ret.join("/");
            } else {
                console.log("four");
            }
        }
        if (rfs.length == 5) {
            rfs.shift();
            ret = ret.map((v, i) => v + rfs[i]);
            //rfs.forEach((r,i)=> {if(r.length) console.log(ret[i],r, w[i])});
            if (check(read, ret)) return ret.join("/");
        }


        // !ss!ss, ss!ss!, ss!!ss ->OK
        if (rfs.length == 3) {
            rfs = rfs.filter(r => r.length);
            if (rfs.length == 2) {
                ret = ret.map((v,i) => v ? v : rfs[i < 2 ? 0 : 1].toKatakana());
                //console.log(w,rfs,ret);
                if (check(read, ret)) return ret.join("/");
            }
        }

        console.log(w, ret, rfs, read);
        return read;
    };
    
    // suggest reading splitter
    if (1)
        return table.map(v => {
            //console.log(v);
            if (v.read[0].indexOf("/") != -1) return v;
            v.read[0] = suggest_read_splitter(v.word[0], v.read[0]);
            console.log(v);
            return v;
        });

    return table.map(v => {
        if (v.read.length == 1) return v;

        var headread = v.read[0];



        var yure = v.read.slice(1).map(r => {
            if (r.slice(0,2)!="y:") return r;
            var ret = suggest_read_splitter(v.word[0], r.slice(2));
            var ys = ret.split("/");
            if (ys.length != 4) return r;
            var rs = headread.split("/");
            var ys0 = ys.slice(0,2).join("/");
            var ys1 = ys.slice(2,4).join("/");
            var ret = [];
            if (ys0 != rs.slice(0,2).join("/")) ret.push("1:"+ys0);
            if (ys1 != rs.slice(2,4).join("/")) ret.push("3:"+ys1);
            return ret.join(";");
        }).join(";").split(";");

        yure = yure.map(y => {
            y = y.split("「").join(":").split("」").join("");
            if (y.indexOf("3:の/") == 0 && v.word[0].slice(2,3) == "之")
                return y.split("3:の/").join("4:");
            return y;
        });
        yure = [...new Set(yure)].sort();
        //console.log(v.read, yure);
        //v.read[0] = suggest_read_splitter(v.word[0], v.read[0]);
        yure.unshift(headread);
        v.read = yure;
        return v;
    });

};


var display_read = (r) => {
    var i = r.findIndex(v => v.match(/^[a-z?\/]+$/));
    if (i < 0) {
        r[0] = r[0].split("/").map(
            (c,i) => '<span>' +        conv.kata(c) + "</span>").join("");
    } else {
        var css = r[i].split("/");
        r.splice(i, 1);
        
        r[0] = r[0].split("/").map((c,i) => {
            if (css[i].length == 0) c = conv.kata(c);
            if (css[i] == "a") c = c.slice(0, -1).toKatakana() + c.slice(-1) + "$";
            
            return '<span ' + (css[i].length ? 'class=' + css[i] : "") + '>' + c + "</span>"
        }).join("");
    }
    if (1 < r.length) {
        r[1] = "(" + r[1].replace(/「(.+?)」/g, (match, v) => v.split("/").map((c,i) => '<span>' + c + "</span>").join("")) + ")";
    }
    return r.join("<br>");
};
var display_read = (r) => {
    var spanning = (v) => v.split("/").map((c,i) => {
        var css = "";
        if (c.match(/[ぁ-ゖ]/)) css = " class=o";
        if (c.indexOf("*")!=-1) css = " class=s";
        return '<a href="#r=' + c + '"' + css+ '>' + c + "</a>";
    }).join("");
    
    var ret = [];
    ret[0] = r[0].split("/").map((c,i) => spanning(c)).join("");
    if (1 < r.length) {
        ret[1] = "(" + r[1].replace(/「(.+?)」/g, (match, v) => spanning(v)) + ")";
    }
    return ret.join("<br>");
};


var test001 = () => {
    rf = "/abc/def";
    var rfs = rf.split("/");
    var rfb = rfs.pop();
    rf = rfs.join("/") + "/" + rfb.replace("def", "/");
    console.log(rf);
};

var check_onkun_misjudge = () => {
    var dicts = reading_list(table.uni);
    ["盛:しょう","陽:みょう","執:ず"].forEach(v => {
        var t = v.split(":");
        if (!dicts[t[0]]) dicts[t[0]] = [];
        dicts[t[0]].push({n:1,r:t[1].toKatakana()});
    });


    // check on-kun misjudge
    var torep = [];
    var ret = Object.keys(dicts)
        .sort((a,b)=> dicts[a][0].r < dicts[b][0].r ? -1 : 1).map(key => {
            return key + ":" +
                dicts[key].map(v => {
                    if (v.r.match(/[ァ-ヶ]/) && !v.r.match(/[ぁ-ん]$/)) {
                        if (3 < v.r.length) v.doubt = true;
                        if (2 == v.r.length && !v.r.match(/[ア-ワ][イウキクチツっッンャュョ]/)) v.doubt = true;
                        if (v.r == "トキ" || v.r == "ヨン") v.doubt = true;
                        if (v.r == "ソコ") v.doubt = false;
                        if (3 == v.r.length && !v.r.match(/[キギシジチヂニヒビピミリ][ャュョ][ンウクツッ]/)) v.doubt = true;
                        if(v.doubt) torep.push([key, v.r, conv.hira(v.r)]);
                        return  v.r + "(" + v.n + ")"  +(v.doubt ? "doubt":"");
                    } else {
                        var rk = v.r.toKatakana();
                        v.doubt = dicts[key].some(d => d.r == rk && !d.doubt);
                        if (v.doubt) torep.push([key, v.r, v.r.toKatakana()]);
                        return v.r + "(" + v.n + ")"  +(v.doubt ? "doubt":"");
                    }
                    
                }).join(", ");
        }).join("\n");

    // swap on-kun 
    table.uni.map(v => {
        var ws = Array.from(v.word[0]);

        v.read = v.read.map((vread,i) => {
            var x = 0;
            var n = "";
            if (i != 0) {
                var r = vread.split(":");
                if (r.length != 2) return vread;
                if (!r[0].match(/^[1-4]$/)) return vread;
                var x = r.shift() - 1;
                //console.log(r);
                r = r[0].split("/");
            } else {
                r = vread.replace(/[0-9]$/, (m) => { n = m; return ""; }).split("/");
                x = 0;
            }
            if (4 < r.length + x) return vread;

            var rmod = r.map((r0,i) => {
                var rep = torep.find(rep => rep[0] == ws[i+x] && rep[1] == r0);
                return (rep) ? rep[2] : r0;
            }).join("/");

            if (r.join("/") == rmod) return vread;
            //console.log(v.id, rmod, n);
            return i ?((x+1)+":"+rmod) : (rmod + n);
        });
        return v;
    });
};

var idsort = () => {
    var major = (v) => {
    };
    table.uni.map(v=> {
        v.ref = "";
        if (v.kk)  v.ref += (v.kk == "#") ? "k" : "K";
        if (v.goo) v.ref += "G";
        if (v.kb)  v.ref += (v.kb == "#") ? "b" : "B";
        if (v.yji) v.ref += "Y";
        if (v.dkw) v.ref += (v.dkw.indexOf("#") == -1) ? "D" : "d";
        if (v.wp) v.ref += "w";
        if (v.smk) v.ref += "g";
        //v.major = v.ref.split("").map(v => [6,3,5,4,2,2,1,1]["KkGBbDdY".indexOf(v)]).reduce((sum,v)=>sum+v,0);
        if (v.ref == "") {
            v.major = 1;
            if (v.replaceable) v.ref += "*";
            else if (v.src) v.ref += "!";
            else {
                //v.id = -10000 + v.id;
                v.major = 0;
            }
        } else {
            v.major = "KGkBDgbYdw".split("").findIndex(c => v.ref.indexOf(c) != -1);
            v.major = 10 - v.major;
            if (6 <= v.major) v.major = 6;
        }
        return v;
    });
    table.uni.sort((a,b) => (b.major - a.major) || (a.word[0] < b.word[0] ? -1 : 1));
    table.uni.map((v,i) => {v.id = v.major ? (i+1) : (7673-i); delete v.ref; delete v.major; return v;});
    table.uni.map((v,i) => console.log(i,v.id,v.ref, v.major, v.word));
};
var ref_append = () => {
    [
        63,112,167,345,360,369,400,423,524,598,4785,635,677,814,955,975,1102,1228,1287,1306,
        1405,1411,1431,1519,1574,1587,1801,1839,1861,2000,2027,2171,2193,2222,2390,2449,2457,2518,2626,//2666?
        2845,2942,3035,3055,3076,3162,3170,3233,3366,3380,3464,3821,4367,4385,4434,4475,4646,4762,
    ].forEach(id => {
        var i = table.uni.findIndex(v => v.id == id);
        if (i == -1 || table.uni[i].goo) {console.log(table.uni[i]); return;}
        table.uni[i].goo = "#idiom_sanseido";
        console.log(table.uni[i]);
    });

};

var onloader = () => {
    // check both yure
    if(0)
    console.log(table.uni.filter(
        v =>
            (2 < v.read.length)  &&
            v.read.some(r => r.indexOf("1:") != -1) &&
            v.read.some(r => r.indexOf("3:") != -1)
    ).map(v => JSON.stringify(v))
               );
    if (0)
    console.log(table.uni.filter(
        v =>
            (2 < v.word.length)  &&
            v.word.some(r => r.indexOf("1:") != -1) &&
            v.word.some(r => r.indexOf("3:") != -1)
    ).map(v => JSON.stringify(v))
               );


    return idsort();
    if (1) {
        return similar_check();
        return check_inconsistent_variants();
    }
    duplicate_check();
    replaceable_check(table.uni);

    if (0){
        // for sanseido appender
        ref_append();

        // id duplicate check
        table.uni.filter((v,i) => i != table.uni.findIndex(v0 => v.id == v0.id)).forEach(
            v => console.log(JSON.stringify(v))
        );
    }
    
    if (1) {
        //itaiji check
        table.uni = table.uni.map(v => {
            var origin = v.word.join(";");
            v.word[0] = itaiji.check(v.word[0]);
            var itai = itaiji.check(v.word[0], true).map(v => v.join("="));
            v.word = [... new Set(v.word.concat(itai))];

            if (v.word.join(";") != origin) console.log(v.word);
            return v;
        });
    }


    if (0) {
        table.uni = table.uni.map(v => { v.read = replace_onkun(v.read); return v; });
    }
    if (1) {
        //yomi splitter
        table.uni = analyze(table.uni);
    }
    // append IDs
    if (1) {
        var x = table.uni.reduce((max,v) => (v.id && max < v.id) ? v.id : max, 0);
        table.uni = table.uni.map(v => {
            if (v.id) return v;
            x++;
            var ret = {id: x};
            Object.keys(v).forEach(key => ret[key] = v[key]);
            return ret;
        });
    }

    if (0) {
        table.uni.map(v => {
            delete v.meanx;
            if (v.mean == "?") v.mean = "";
            if (v.src || v.mean || v.meant) return v;
            delete v.mean;
            delete v.meant;
            delete v.src;
            return v;
        });
    }

    //merge duplicated yomi-yure
    if (0) {
        table.uni.map(v => {
            if (v.word[0].slice(0,2) == "有職") {
                var yure = ["1:ユウ/ショク","1:ユウ/ソコ"];
                yure.unshift(v.read[0]);
                //console.log(yure, v.read);
                v.read = yure;
                return v;
            }
            if (v.read.length < 3 || v.read.join(";").indexOf("?") == -1) return v;
            //console.log(v.read);1
            var yure = v.read.slice(1).filter((r,i,self) => {
                if (r.indexOf("??") == -1) return true;
                var rx = r.toKatakana().split("??").join("");
                return (!self.some(rd => rd.toKatakana() == rx));
            });
            yure.unshift(v.read[0]);
            v.read = yure;
            return v;
        });
    }


    return;

    
    var draw_table = (unitable, x0) => {
        // query check
        var x = (x0).split("#").pop();

        // dump yomi list
        if (x.split("r=").length > 1) {

        }

        // pick subset table
        var qs = x.split("q=");
        if (1 < qs.length && qs[1] != "") {
            var q = decodeURI(x.split("q=").pop()).split(",");
            var subset = unitable.filter(v => q.every(q0 => v.word.join("").indexOf(q0) != -1));
            $id("search").value = q;
        } else {
            var subset = unitable.filter(v => !v.kk && !v.goo && !v.kb && !v.yji);
            //mean.indexOf("[kb") == -1 && v.mean.indexOf("⇒") == -1);//.filter(v=>v.read[0].indexOf("/") == -1); //
            $id("search").value = "";
        }

        // dump result
        $id("result").innerHTML = head.join(" ") + "<div>result:" + subset.length + "</div><div id=idiomlist>"
            + subset.slice(x, x + 100).map((v,i) => dump_row(v, x+i+1)).join("") + "</div>";

        //$id("ret").value = subset.map(v => "https://kotobank.jp/gs/?q=" + encodeURI(v.word[0].split("之").join("の")) + " # " + v.word[0] ).join("\n");
    };

};


var getfile = (fname, cb) => {
    //return;
    const fs = require('fs');
    var less;
    try {
        less = fs.readFileSync(fname, 'utf8');
    } catch (err) {
        console.log(fname + ": OpenError");
    }
    
    console.log(fname + ": Opened");
    if (less) cb({responseText: less});
};

var flist = [
    {
        fname:"yoji.json",
        cb:(ajax) => {
            table.uni = JSON.parse(ajax.responseText.trim());
            table.uni.map(v => {
                v.sword = make_word_var(v.word);
                v.sread = make_read_var(v.read);
                return v;
            });
        },
    },
    {fname:"data/goo200806.dat",
     cb: (ajax) => {
         table.goo = (ajax.responseText).split("\n").map(r => {
             var v = r.split("\t");
             if (v.length < 3) return;
             var ret = {};
             try {
                 ret.path = decodeURI(v.shift())
             } catch(e) {
                 console.log(v);
             }
             ret.word = v.shift();
             ret.mean = v;
             return ret;
         }).filter(v => v);

        //merge
        table.goo.forEach((g) => {
            var w = g.word.split("】").join("").split("【");
            var gword = w[1];
            var gread = w[0];
            
            var gwordy = itaiji.check(gword);
            if (gwordy != gword) {
                g.path = gword + g.path;
                gword = gwordy;
            }
            
            //console.log(g);
            var i = table.uni.findIndex(u => u.sword && (u.sword.indexOf(gword) != -1));
            if (i != -1) {
                if (table.uni[i].word[0] != gword && g.path.slice(0,1) == "/") g.path = gword + g.path;
                g.word = gword;
                g.read = gread;
                return table.merge_row(i, g, "goo");
            }
            
            //var i = table.uni.findIndex(u => conv.hira(u.sread[0]) == conv.hira(gread));
            
            
            // append row
            table.append_row(gread, gword, g.path, "yji");
            
        });


     }},
    /*
    {fname:"goohoi2.dat",
     cb: (ajax) => {
         table.goo = (ajax.responseText).split("\n").map(r => {
             var v = r.split("\t");
             if (v.length < 3) return;
             var ret = {};
             try {
                 ret.path = decodeURI(v.shift())
             } catch(e) {
                 console.log(v);
             }
             ret.word = v.shift();
             ret.mean = v;
             return ret;
         }).filter(v => v);
     }},
*/
    {fname: "data/kanken200730.dat",
     cb:(ajax) => {
         table.kk = (ajax.responseText).split("\n").map(r => {
             var v = r.split("\t");
             if (v.length < 3) return;
             var ret = {};
             ret.path = v.shift();
             ret.word = v.shift().replace(/\[std_(\w+)\]/, (match,p) => String.fromCharCode("0x" + p));
             ret.read = v.join("");
             return ret;
         }).filter(v => v);
         //console.log(table);

         // merge
         table.kk.forEach((k) => {
             k.word = itaiji.check(k.word);
             k.word = Array.from(k.word).map((c,i,self) => c=="々"? self[i-1]: c).join("");
             
             var i = table.uni.findIndex(u => u.sword && (u.sword.indexOf(k.word) != -1));
             if (i != -1) {
                 return table.merge_row(i, k, "kk");
             }
             
             //var i = table.uni.findIndex(u => conv.hira(u.read[0]) == conv.hira(k.read));
             if (i = -1) {
                 return table.merge_row(i, k, "kk");
             }
             
             // append row
             table.append_row(k.read, k.word, k.path, "kk");
         });

     }},
    {fname:"data/yji200806.dat",
     cb: (ajax) => {
         table.yji = (ajax.responseText).split("\n").map(r => {
             var v = r.split("\t");
             if (v.length < 3) return;
             if (v.length != 3) console.log(v);
             var ret = {};
             ret.path = decodeURI(v.shift())
             ret.word = v.shift();
             ret.read = v.shift();
             return ret;
         }).filter(v => v);

         //merge
         table.yji.forEach((k) => {
             k.word = itaiji.check(k.word);
             k.word = Array.from(k.word).map((c,i,self) => c=="々"? self[i-1]: c).join("");
             //var i = table.uni.findIndex(u => same(u.word , k.word));
             var i = table.uni.findIndex(u => u.sword && (u.sword.indexOf(k.word) != -1));
             
             if (i != -1) {
                 return table.merge_row(i, k, "yji");
             }
             
             //var i = table.uni.findIndex(u => same(u.read, k.read));
             //var i = table.uni.findIndex(u => conv.hira(u.read[0]) == conv.hira(k.read));
             if (i != -1) {
                 return table.merge_row(i, k, "yji");
             }
             
             // append row
             table.append_row(k.read, k.word, k.path, "yji");
         });
         
     }},
    {fname:"data/kotobank200813.dat",
     cb: (ajax) => {
         table.kb = (ajax.responseText).split("\n").map(r => {
             var v = r.split("\t");
             if (v.length < 2) return;
             if (v.length != 2) console.log(v);
             var ret = {};
             ret.word = v.pop().replace(/^[0-9]+/, "").split("の").join("之");
             ret.path = "-";
             //ret.read = v.shift();
             return ret;
         }).filter(v => v);
         //console.log(table.kb);
         
         //append
         table.kb.forEach((k) => {
             k.word = itaiji.check(k.word);
             k.word = Array.from(k.word).map((c,i,self) => c=="々"? self[i-1]: c).join("");
             //var i = table.uni.findIndex(u => same(u.word , k.word));
             var i = table.uni.findIndex(u => u.sword && (u.sword.indexOf(k.word) != -1));
             
             if (i != -1) {
                 return table.merge_row(i, k, "kb");
             }
             
             // append row
             table.append_row(null, k.word, "-", "kb");
         });

     },
    },
    {
        fname:"dkw.dat",
        cb:(ajax) => {
            table.dkw = (ajax.responseText).split("\n").map(r => {
                var v = r.split("\t");
                if (v.length < 3) return;
                if (v.length != 3) console.log(v);
                var ret = {};
                ret.word = v.pop();
                ret.path = v.shift();
                return ret;
            }).filter(v => v);
        },
    },
    {
        fname:"data/xls091114.dat",
        cb:(ajax) => {
            table.xls = (ajax.responseText).split("\n").map(r => {
                var v = r.split("\t");
                if (v.length != 4) return;
                var ret = {};
                ret.id = parseInt(v.shift());
                ret.read = v.pop(); 
                ret.word = v.pop().replace(/\[(.+?)\|(.+?)\]/g, (m, p1,p2) => p1).split("樓").join("楼").split("緖").join("緒");
                ret.path = v.pop();
                return ret;
            }).filter(v => v);
            //merge
            table.xls.forEach(k => {
                if (!k.word) return;
                k.word = itaiji.check(k.word);
                k.word = Array.from(k.word).map((c,i,self) => c=="々"? self[i-1]: c).join("");
                //var i = table.uni.findIndex(u => same(u.word , k.word));
                var i = table.uni.findIndex(u => u.sword && (u.sword.indexOf(k.word) != -1));
                if (i != -1) {
                    return table.merge_row(i, k, "meanx");
                }

                var kread = conv.hira(k.read);
                var us = table.uni.filter(u => u.sread && (u.sread.map(v => conv.hira(v)).indexOf(kread) != -1));
                if (us.length) {
                    if (us.length !=1 ) console.log("meanx:dupl:", k.read);
                    us.forEach(u0 => {
                        var i = table.uni.findIndex(u => u.id == u0.id);
                        return table.merge_row(i, k, "meanx", true);
                    });
                    return;
                }
                // append row
                table.append_row(k.read, k.word, k.path, "meanx", {id: k.id});
            });
        },
    },
    {
        fname:"tmpjsons/dkwplus8.json",
        cb:(ajax) => {
            table.dkw = JSON.parse(ajax.responseText).map(v => {
                var ret = {};
                if (v.dkwt) {
                    var dkws = v.dkwt[0].split(".");
                    dkws[0] = dkws[0].split("DW").join("dkw-");
                    dkws[1] = "'".repeat(dkws[1]) + ".";
                    dkws[2] = dkws[2].toLowerCase();
                    dkws[3] = "'".repeat(dkws[3]);
                    v.dkw = dkws.join("");//v.dkwt[0];
                }
                ret.word = v.uni;
                ret.path = v.dkw; 
                ret.type = v.type;
                return ret;
            }).map(v => {
                if (v.type.slice(0,1)=="x") return;
                //if (v.type.slice(0,1)!="<") return;
                if (v.type == "" || v.type == "A") return v;
                v.path += "#_";
                return v;
            }).filter(v => v);
            table.dkw.forEach(v => console.log(v));

            // merge
            table.dkw.forEach((k) => {
                var i = table.uni.findIndex(u => (u.sword || u.word).indexOf(k.word) != -1);
            
                if (i != -1) {
                //console.log(k);
                    if (k.type != "<") {
                        return table.merge_row(i, k, "dkw");
                    }
                    if (table.uni[i].replaceable) return;
                    table.uni[i].replaceable = true;
                    k.word = table.uni[i].word[0].slice(2,4) + table.uni[i].word[0].slice(0,2);
                    var r = table.uni[i].read[0].split("/");
                    try {
                        k.read = r.slice(2,4).join("/") + "/" + r.slice(0,2).join("/");
                    } catch(e) {
                        console.log(r);
                    }
                    return table.append_row(k.read, k.word, k.path, "dkw", {replaceable:true});
                }
                // append row
                table.append_row("", k.word, "-", "dkw");
            });
        },

    },
];

//現在時刻取得（yyyymmddhhmmss）
var getCurrentTime = () => {
    var now = new Date();
    var padZero = num => ((num < 10 ? "0" : "") + num);
    return  "" + now.getFullYear().toString().slice(-2)
        + padZero(now.getMonth() + 1)
        + padZero(now.getDate()) + "_"
        + padZero(now.getHours())
        + padZero(now.getMinutes())
        + padZero(now.getSeconds());
};


var main = () => {

    var done = 0;
    flist
        .slice(0,1)
        .forEach(v => {
        getfile(v.fname, (ajax) => {
            v.cb(ajax);
        });
    });

    onloader();
    //return;
    
    table.uni.map(v => {delete v.sword; delete v.sread; return v;});
    //resort("hansort");

    var data = table.uni
        //.filter(v=> !v.kk & !v.kb & !v.dkw & !v.goo & !v.yji && !v.meanref && (v.meanx || "").indexOf("[hj]") != -1 )
        .map(v => JSON.stringify(v))
        .join(",\n");

    const fs = require("fs");
    const fname = "tmpjsons/yoji"+ getCurrentTime() + ".json";
    fs.writeFile(fname, data, (err) => {
        if (err) throw err;
        console.log(fname + ':書込完了');
    });
    return;
    
    var data = JSON.stringify(table.uni).split('{"read":').join("\n"+'{"read":').split('{"id":').join("\n"+'{"id":');
};



main();
