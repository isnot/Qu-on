const util = require('util');

class Utils {
  constructor() {
    this.timer_id = undefined;
  }

  clearTimer() {
    if (this.timer_id) {
      clearTimeout(this.timer_id);
      this.timer_id = undefined;
    }
  }

  async wait_sec(sec = 1) {
    this.clearTimer();
    await new Promise((resolve) => {
      this.timer_id = setTimeout(resolve, sec * 1000);
    });
  }

  simple_wait_sec(sec = 1) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  safeRetrieve(target, pos, alternate) {
    try {
      const value = this.deepRetrieve(target, pos);
      return typeof value === typeof alternate ? value : alternate;
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

module.exports = new Utils();
