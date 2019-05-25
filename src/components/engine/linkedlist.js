class Node {
    constructor(val, prev, next) {
        this.prev = prev;
        this.next = next;
        this.value = val;
    }
}

export class LinkedList {
    constructor() {
        this.start = null;
        this.end = null;
        this.len = 0;
    }

    push(val) {
        this.len++;
        if (!this.end) {
            this.start = new Node(val);
            this.end = this.start;
            return;
        }
        let node = new Node(val, this.end);
        this.end.next = node;
        this.end = node;
    }

    pop(r) {
        if (!this.end) {
            return undefined;
        }
        let node = this.end;
        this.remove(node);
        return r ? node : node.value;
    }

    peekLast(r) {
        if (!this.end) {
            return undefined;
        }
        return r ? this.end : this.end.value;
    }

    peekFirst(r) {
        if (!this.start) {
            return undefined;
        }
        return r ? this.start : this.start.value;
    }

    unshift(val) {
        this.len++;
        if (!this.start) {
            this.end = new Node(val);
            this.start = this.end;
            return;
        }
        let node = new Node(val, undefined, this.start);
        this.start.prev = node;
        this.start = node;
    }

    shift(r) {
        if (!this.start) {
            return undefined;
        }
        let node = this.start;
        this.remove(node);
        return r ? node : node.value;
    }

    remove(node) {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.start = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.end = node.prev;
        }
        this.len--;
    }
}

/*
let ll = new LinkedList();

console.log(ll);

for (let i = 0; i < 10; i++) {
    ll.push(i);
}
console.log(ll.len, 10);
for (let i = 0; i < 10; i++) {
    console.log(ll.peekLast(), ll.pop());
}
console.log(ll.len);

console.log(ll);

for (let i = 0; i < 10; i++) {
    ll.unshift(i);
}
console.log(ll.len, 10);
for (let i = 0; i < 10; i++) {
    console.log(ll.peekFirst(), ll.shift());
}
console.log(ll.len);

console.log(ll);

for (let i = 0; i < 10; i++) {
    ll.unshift(i);
}
console.log(ll.len, 10);
for (let i = 0; i < 10; i++) {
    console.log(ll.peekLast(), ll.pop());
}
console.log(ll.len);

console.log(ll);

for (let i = 0; i < 10; i++) {
    ll.push(i);
}
console.log(ll.len, 10);
for (let i = 0; i < 10; i++) {
    console.log(ll.peekFirst(), ll.shift());
}
console.log(ll.len);

console.log(ll);
*/