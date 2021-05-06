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

type AnyChannel = ReturnType<typeof buildChannel>;

function nameChannel (name: string, channel: AnyChannel) {
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

export type FireChannel<O extends Origin, Message> = {
    sender (name: string, ipc: SourceOf<O>): (message: Message) => void;
    receiver (name: string, ipc: SinkOf<O>): (handler: (event: EventOf<O, 'fire'>, message: Message) => void) => void;
};

export type RequestChannel<O extends 'renderer', ReqT, RespT> = {
    sender (name: string, ipc: SourceOf<O>): (req: ReqT) => Promise<RespT>;
    receiver (name: string, ipc: SinkOf<O>): (handler: (event: EventOf<O, 'request'>, req: ReqT) => RespT | Promise<RespT>) => void;
};

export type NamedChannel<C> = C extends {
    sender (name: string, ipc: infer Source): infer SendResult;
    receiver (name: string, ipc: infer Sink): infer ReceiveResult;
} ? {
    sender (ipc: Source): SendResult;
    receiver (ipc: Sink): ReceiveResult;
}: never;

function fire<Message> (origin: 'main'):                   FireChannel<'main', Message>;
function fire<Message> (origin: 'main', name: string):     NamedChannel<FireChannel<'main', Message>>;
function fire<Message> (origin: 'renderer'):               FireChannel<'renderer', Message>;
function fire<Message> (origin: 'renderer', name: string): NamedChannel<FireChannel<'renderer', Message>>;
function fire (_: Origin, name?: string) {
    const channel = buildChannel({ send: 'send', receive: 'on' });
    return (name) ? nameChannel(name, channel) : channel;
}

function request<Req, Resp = void> (origin: 'renderer'):               RequestChannel<'renderer', Req, Resp>;
function request<Req, Resp = void> (origin: 'renderer', name: string): NamedChannel<RequestChannel<'renderer', Req, Resp>>;
function request (_: 'renderer', name?: string) {
    const channel = buildChannel({ send: 'invoke', receive: 'handle' });
    return (name) ? nameChannel(name, channel) : channel;
}

function named<C> (name: string, channel: C): NamedChannel<C>
function named (name: string, channel: AnyChannel) {
    return nameChannel(name, channel);
}

export { fire, request, named };
