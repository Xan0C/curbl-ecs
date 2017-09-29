"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SignalNode {
    constructor(cbFunc, cbContext = null, once = false) {
        this.cbFunc = cbFunc;
        this.cbContext = cbContext;
        this.once = once;
        this.parent = undefined;
        this.next = undefined;
    }
    /**
     * Dispose this SignalBinding
     * This sets the parent.next and child.parent element new
     * @returns {SignalNode} - The child element of this node
     */
    dispose() {
        let next = this.next;
        if (this.parent) {
            this.parent.next = this.next;
        }
        if (this.next) {
            this.next.parent = this.parent;
        }
        this.parent = undefined;
        this.next = undefined;
        this.cbFunc = undefined;
        this.cbContext = undefined;
        this.once = undefined;
        return next;
    }
}
exports.SignalNode = SignalNode;
/**
 * Implementation of Signals as double linked list
 */
class Signal {
    constructor() {
        this.root = undefined;
    }
    addNode(cbName, context, once, parent) {
        const node = new SignalNode(cbName, context, once);
        this.insertAfter(parent, node);
        return this;
    }
    insertAfter(parent, node) {
        if (node) {
            if (!parent) {
                return this.insertAsRoot(node);
            }
            let next = parent.next;
            parent.next = node;
            node.parent = parent;
            if (next) {
                node.next = next;
                next.parent = node;
            }
        }
        return this;
    }
    insertAsRoot(node) {
        if (this.root) {
            this.root.parent = node;
            node.next = this.root;
        }
        this.root = node;
        return this;
    }
    add(cbFunc, context, parent) {
        this.addNode(cbFunc, context, false, parent);
        return this;
    }
    addOnce(cbFunc, context, parent) {
        this.addNode(cbFunc, context, true, parent);
        return this;
    }
    getNode(cbFunc, context) {
        let node = this.root;
        while (node) {
            if (node.cbFunc === cbFunc && (!context || node.cbContext === context)) {
                return node;
            }
        }
        return undefined;
    }
    remove(cbObject, cbFunc) {
        let node = this.root;
        while (node) {
            if (node.cbContext === cbObject) {
                if (cbFunc && node.cbFunc === cbFunc) {
                    node = node.dispose();
                }
                else if (!cbFunc) {
                    node = node.dispose();
                }
                else {
                    node = node.next;
                }
            }
            else {
                node = node.next;
            }
            if (!this.root || !this.root.cbContext) {
                this.root = node;
            }
        }
        return this;
    }
    dispatch(a0, a1, a2, a3, a4, a5, a6, a7) {
        let node = this.root;
        while (node) {
            node.cbContext[node.cbFunc](a0, a1, a2, a3, a4, a5, a6, a7);
            if (node.once) {
                node = node.dispose();
            }
            else {
                node = node.next;
            }
        }
        return this;
    }
    /**
     * Checks if the signal contains the given object
     * @param cbObject
     * @returns {boolean}
     */
    has(cbObject, cbName) {
        let node = this.root;
        while (node) {
            if ((node.cbContext === cbObject) && (node.cbFunc === cbName || !cbName)) {
                return true;
            }
            else {
                node = node.next;
            }
        }
        return false;
    }
    clear() {
        let node = this.root;
        while (node) {
            node = node.dispose();
        }
        if (this.root) {
            this.root = this.root.dispose();
        }
        return this;
    }
    dispose() {
        this.clear();
    }
}
exports.Signal = Signal;
