const util = require('util');

class Utils {
  async wait_sec(sec = 1) {
    const milsec = sec * 1000;
    await new Promise((resolve) => setTimeout(resolve, milsec));
  }

  parseSong(song = {}) {
    const artist = this.safeRetrieve(song, 'Artist', '');
    const title = this.safeRetrieve(song, 'Title', '');
    const file = this.safeRetrieve(song, 'file', '');
    const id = this.safeRetrieve(song, 'Id', '');
    const elapsed = this.safeRetrieve(song, 'elapsed', '');
    return `[${id}] ${this.formatSeconds(elapsed)}\n👤${artist} 🎵${title}\n💿${file}`;
  }

  safeRetrieve(target, pos, alternate) {
    try {
      const value = this.deepRetrieve(target, pos);
      return typeof value === 'string' ? value : alternate;
    } catch (e) {
      return alternate;
    }
  }

  deepRetrieve(target, pos) {
    let cur = target;
    if (typeof pos !== 'string' || typeof target !== 'object' || target === null) {
      return undefined;
    }
    try {
      pos.split('.').forEach((el) => {
        if (this.hasProperty(cur, el)) {
          cur = cur[el];
        } else {
          throw new Error('deepRetrieve: element not found');
        }
      });
    } catch (e) {
      return undefined;
    }
    return cur;
  }

  // const hasProperty = Object.prototype.hasOwnProperty;
  hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  formatSeconds(sec = 0, su = 1) {
    const min = Math.trunc(sec / 60);
    const sec_f = Number.parseFloat(sec % 60).toFixed(su);
    const s_sec = Number(sec_f) < 10 ? `0${sec_f}` : String(sec_f);
    return `${min}:${s_sec}`;
  }

  objToStr(value, depth = 1) {
    return util.inspect(value, { showHidden: false, depth: depth, colorize: true });
  }

  matchCommand(target = '', regex) {
    return target.match(regex);
  }

  each(target, func) {
    if (Array.isArray(target)) {
      target.forEach((item) => {
        func(item);
      });
    } else if (typeof target === 'object') {
      Object.keys(target).forEach((key) => {
        func(key, target[key]);
      });
    }
  }

  radians(dig) {
    return (dig * Math.PI) / 180;
  }

  // usage) range = distance({lat: x1, lng: y1}, {lat: x2, lng: y2});
  distance(here, there) {
    // eslint-disable-next-line no-unused-expressions
    return (
      6366.78 *
      Math.acos(
        Math.sin(this.radians(there.lat)) * Math.sin(this.radians(here.lat)) +
          Math.cos(this.radians(there.lat)) *
            Math.cos(this.radians(here.lat)) *
            Math.cos(this.radians(Math.abs(here.lng - there.lng)))
      )
    );
  }

  getNextKeyOf(obj, key) {
    let target;
    let matched = false;
    if (typeof obj !== 'object' || obj === null || !key) {
      return key;
    }
    const keys = Object.keys(obj).sort();
    const first = keys[0];
    keys.forEach((ki) => {
      if (matched) {
        target = ki;
        matched = false;
      }
      if (String(ki) === String(key)) {
        matched = true;
      }
    });
    if (!target) {
      target = first;
    }
    return target;
  }

  Any2Json(param) {
    let text;
    if (typeof param === 'function') {
      text = param.toString();
    }
    if (typeof param === 'object') {
      text = JSON.stringify(param);
    }
    if (typeof param !== 'string') {
      text = String(param);
    } else {
      text = param;
    }
    return text;
  }

  ArrayHash2Hash(ah, pk, vk) {
    const h = {};
    const hasVk = typeof vk === 'string';
    this.each(ah, (item) => {
      if (hasVk) {
        h[item[pk]] = item[vk];
      } else {
        h[item[pk]] = item;
      }
    });
    return h;
  }

  ArrayHash2HashArray(ah, pk, vk) {
    const h = {};
    const hasVk = typeof vk === 'string';
    this.each(ah, (item) => {
      if (!this.hasProperty(h, item[pk])) {
        h[item[pk]] = [];
      }
      if (hasVk) {
        h[item[pk]].push(item[vk]);
      } else {
        h[item[pk]].push(item);
      }
    });
    return h;
  }

  ArrayArray2Any(ah, i, vi) {
    const h = {};
    let ih;
    let iidx;
    let pk;
    let counter = 0;
    this.each(ah, (item) => {
      if (typeof i === 'number') {
        pk = item[i];
      } else {
        pk = counter;
        counter += 1;
      }
      if (vi && Array.isArray(vi)) {
        iidx = 0;
        ih = {};
        this.each(item, (el) => {
          ih[vi[iidx]] = el;
          iidx += 1;
        });
        h[pk] = ih;
      } else if (Number(vi) > -1) {
        h[pk] = item[vi];
      } else {
        h[pk] = item;
      }
    });
    return h;
  }

  replaceCharactorEntity4TgHtml(text) {
    if (typeof text !== 'string' || !text) {
      return text;
    }
    const ent = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      // '*' : '&#42;',
      // '_' : '&#95;',
    };
    return text.replace(/[<>&]/g, (match) => {
      return ent[match];
    });
  }
}

module.exports = {
  Utils,
};
