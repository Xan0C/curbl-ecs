class SignalNode {
    public parent:SignalNode;
    public next:SignalNode;
    public cbFunc:string;
    public cbContext:any;
    public once:boolean;

    constructor(cbFunc:string,cbContext:any=null,once:boolean=false){
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
    public dispose():SignalNode{
        let next = this.next;
        if(this.parent){
            this.parent.next = this.next;
        }
        if(this.next){
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

/**
 * Implementation of Signals as double linked list
 */
export class Signal {
    private root:SignalNode;

    constructor(){
        this.root = undefined;
    }

    private addNode(cbName:string,cbObject:string,once?:boolean,front:boolean=true):Signal{
        if(!this.root){
            this.root = new SignalNode(cbName,cbObject,once);
            return;
        }
        const node = new SignalNode(cbName,cbObject,once);
        if(front){
            this.insertAsRoot(node);
        }else{
            this.insertEnd(node);
        }
        return this;
    }

    private insertEnd(node:SignalNode):Signal{
        let current = this.root;
        while(current.next){
            current = current.next;
        }
        current.next = node;
        current.next.parent = current;
        return this;
    }

    private insertAsRoot(node:SignalNode):Signal{
        this.root.parent = node;
        node.next = this.root;
        this.root = node;
        return this;
    }

    public add(cbFunc:string,cbObject:any,front?:boolean):Signal{
        this.addNode(cbFunc,cbObject,false,front);
        return this;
    }

    public addOnce(cbFunc:string,cbObject:any,front?:boolean):Signal{
        this.addNode(cbFunc,cbObject,true,front);
        return this;
    }

    public remove(cbObject:any,cbFunc?:string):Signal{
        let node = this.root;
        while(node){
            if(node.cbContext === cbObject){
                if(cbFunc && node.cbFunc === cbFunc){
                    node = node.dispose();
                }else if(!cbFunc) {
                    node = node.dispose();
                }else{
                    node = node.next;
                }
            }else{
                node = node.next;
            }
            if(!this.root.cbContext){
                this.root = node;
            }
        }
        return this;
    }

    public dispatch(a0?, a1?, a2?, a3?, a4?, a5?, a6?, a7?):Signal{
        let node = this.root;
        while(node){
            node.cbContext[node.cbFunc](a0,a1,a2,a3,a4,a5,a6,a7);
            if(node.once){
                node = node.dispose();
            }else{
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
    has(cbObject:any,cbName?:string):boolean{
        let node = this.root;
        while(node){
            if( (node.cbContext === cbObject) && (node.cbFunc === cbName || !cbName)){
                return true;
            }else{
                node = node.next;
            }
        }
        return false;
    }

    public clear():Signal {
        let node = this.root;
        while(node){
            node = node.dispose();
        }
        this.root = this.root.dispose();
        return this;
    }

    public dispose(){
        this.clear();
    }
}