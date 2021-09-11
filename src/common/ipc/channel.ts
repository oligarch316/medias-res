import type {
    IpcMain,
    WebContents,
    IpcMainEvent,
    IpcMainInvokeEvent,

    IpcRenderer,
    IpcRendererEvent,
} from "electron";

// TODO: receiver calls should return a 'remove listener' callback instead of void

type MethodSet = { send: 'send'; receive: 'on' } |
                 { send: 'invoke'; receive: 'handle' };

function buildChannel (methods: MethodSet) {
    return {
        sender: (name, ipc) => message => ipc[methods.send](name, message),
        receiver: (name, ipc) => handler => ipc[methods.receive](name, handler), 
    };
}

type Any = ReturnType<typeof buildChannel>;

function nameChannel (name: string, channel: Any) {
    return {
        sender: (ipc) => channel.sender(name, ipc),
        receiver: (ipc) => channel.receiver(name, ipc),
    };
}

type Origin = 'main' | 'renderer';
type Method = 'fire' | 'request';

type SourceOf<O extends Origin> = O extends 'main' ? WebContents : IpcRenderer;
type SinkOf<O extends Origin> = O extends 'main' ? IpcRenderer : IpcMain;

type FireEventOf<O extends Origin> = O extends 'main' ? IpcRendererEvent : IpcMainEvent;
type RequestEventOf<O extends Origin> = O extends 'main' ? never : IpcMainInvokeEvent;
type EventOf<O extends Origin, M extends Method> = M extends 'fire' ? FireEventOf<O> : RequestEventOf<O>;

export type Fire<O extends Origin, Message> = {
    sender (name: string, ipc: SourceOf<O>): (message: Message) => void;
    receiver (name: string, ipc: SinkOf<O>): (handler: (event: EventOf<O, 'fire'>, message: Message) => void) => void;
};

export type Request<O extends 'renderer', ReqT, RespT> = {
    sender (name: string, ipc: SourceOf<O>): (req: ReqT) => Promise<RespT>;
    receiver (name: string, ipc: SinkOf<O>): (handler: (event: EventOf<O, 'request'>, req: ReqT) => RespT | Promise<RespT>) => void;
};

export type Named<C> = C extends {
    sender (name: string, ipc: infer Source): infer SendResult;
    receiver (name: string, ipc: infer Sink): infer ReceiveResult;
} ? {
    sender (ipc: Source): SendResult;
    receiver (ipc: Sink): ReceiveResult;
}: never;

function fire<Message> (origin: 'main'):                   Fire<'main', Message>;
function fire<Message> (origin: 'main', name: string):     Named<Fire<'main', Message>>;
function fire<Message> (origin: 'renderer'):               Fire<'renderer', Message>;
function fire<Message> (origin: 'renderer', name: string): Named<Fire<'renderer', Message>>;
function fire (_: Origin, name?: string) {
    const channel = buildChannel({ send: 'send', receive: 'on' });
    return (name) ? nameChannel(name, channel) : channel;
}

function request<Req, Resp = void> (origin: 'renderer'):               Request<'renderer', Req, Resp>;
function request<Req, Resp = void> (origin: 'renderer', name: string): Named<Request<'renderer', Req, Resp>>;
function request (_: 'renderer', name?: string) {
    const channel = buildChannel({ send: 'invoke', receive: 'handle' });
    return (name) ? nameChannel(name, channel) : channel;
}

function named<C> (name: string, channel: C): Named<C>
function named (name: string, channel: Any) {
    return nameChannel(name, channel);
}

export { fire, request, named };
