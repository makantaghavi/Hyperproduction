# Hyperproduction

Hyperproduction is a program for connecting things together in real-time and controlling them easily. It started as [Ben's masters thesis](http://opera.media.mit.edu/publications/bloomberg_ms_thesis_hyperproduction_2014.pdf) and has since been used on many productions to drive interactive control systems for sound, lighting and experience design. Hyperproduction has a few core goals:

* To be fast to work in during a rehearsal and not require recompilations or restarts
* To support a very wide range of (IP) control protocols, from websockets, to ArtNet to OSC
* To allow designers to make interactive systems easily, not bounded by the limitations of timecode
* To be very easy to extend and manipulate in order to add new features quickly

Hyperproduction is almost entirely written in Javascript. 

## Installation
To install Hyperproduction, use the following process. You will need the latest node and npm.  For now **do not** use the `InstallDevEnvironment.sh` script, instead run the following:  
```
cd app
npm install
```

**One important note:** Right now we frustratingly require a recursive symlink from app/node_modules/hp to app. The install script should do this, but sometimes does not get it right. It should look like this:

```
benbrmbp:app/node_modules benb$ ls -la hp
lrwxr-xr-x  1 benb  staff  2 Apr  7 00:12 hp -> ..
```


To run Hyperproduction:
```
cd app
npm start
```

## Basics
Hyperproduction processes data from any source that is accessible to NodeJS. The data is passed through a graph of **nodes** and then generally sent somewhere to control something (like a sound system or a lighting console!) 

### Nodes  & Maps
**Nodes** are little snippets of processing functionality and can easily be created and modified on the fly. When starting Hyperproduction, a list of pre-made nodes is shown on the left. These can be dragged into the map and connected to each other. There are a few special actions that are associated with nodes:

- **double click** a node to open it's GUI (only some nodes, like `Graph`, have GUIs)
- **cmd (or cntrl) +double click** a node to open its editor
- **shift+double click** on a node title to name that node (important for inlets and outlets)
- **option(alt)+click** on a node to mute/unmute it to temporarily stop data passing through
- **double click** a node's port to open the editor for that port and input a value directly
- **option(alt)+ double click** a node's port to allow it to be preset (more on this later) 

The **node editor** is a very important (perhaps even a defining) part of Hyperproduction and can be opened by cmd/control double clicking any node. It allows one to edit the function of a node by defining it's operation and inputs and outputs. As soon as the node is edited, the changes are live— no need to recompile, save or restart. Many nodes require ports to be defined with specific names (`OSCMessage` for example) as part of their core functionality.

Each node also has **port editors** which allow one to directly set the value on a port. These are opened by double clicking a green port on the node. 

**Maps** are a collection of nodes. These are represented as JSON and can be edited by hand if necessary, stored with .hpm extensions in the maps directory. The basic format of these maps is described in the thesis. At some point we'll describe it here. To nest a map within another map, special Inlet and Outlet nodes are provided. These nodes must be named. Once named, maps show up in the node list below all the nodes. We'll flesh out this section more soon!

### OSC
Getting OSC in and out of Hyperproduction is relatively simple. At some point we will add a folder of example maps. Until then, this description can hopefully get folks started:

* Add a `UDPTransceiver` node. This node both sends and receives UDP packets. The listening and transmitting ports, and IP address can be set using respective port editors.
* Add an `OSCMessage` node, open the node editor and add either input or output ports with the OSC addresses you'd like to send or receive from. If you want to send, add inputs, to receive, add outputs. The "/" will be converted to underscores in the GUI, but this is ok!
* Connect the `OSCMessage` node to the `UDPTransceiver` node's `bufOut` and/or `bufIn` depending on whether you want to send or receive (you can actually do both!)

## Acknowledgements
* [Peter Torpey](http://petertorpey.com) is responsible for much of the current functionality of this project.
* David Nunez created the initial preset module
* Kevin King contributed some helper utilities for FFT and MIDI to OSC conversion and a lot of code for Fensadense!
* Makan Taghavi contributed to make this project open source by perfoming unit testing for the main modules, enhanced documentation and distribution.
