intocps-ui
---

UI app for the INTO-CPS tool chain.

![The INTO-CPS App](src/resources/screenshot.png?raw=true "The INTO-CPS App")



How to build
---
The app is built with [Electron](http://electron.atom.io/) and
[Node.js](https://nodejs.org/). You need npm (comes with Node.js). We use Gulp
to manage tasks. It's easiest to have it installed globally (`npm install -g
gulp`). 

After checking out the repo...

1. To install node dependencies: `npm install`
2. To install other resources: `gulp init`
3. To build the UI: `gulp`
4. To run it: `npm start`


Development
---
For an editor, [Visual Studio Code](https://code.visualstudio.com/) is a good choice. It's
cross-platform and is actually built on top of Electron. That said, you can use
whatever you want.

Further developer info is available in https://github.com/into-cps/intocps-ui/wiki

Latest builds
---
The master branch is built automatically on git pushes and the output, for
successful builds, is uploaded to: http://overture.au.dk/into-cps/into-cps-app/master/latest/

These builds represent ongoing work. They have not been fully tested and are
not guaranteed to work. Normally, you are advised to use one of the
[releases](https://github.com/into-cps/intocps-ui/releases) .


About
---
INTO-CPS is an EU Horizon 2020 research project that is creating an integrated
tool chain for comprehensive Model-Based Design of Cyber-Physical Systems.  For
more, see: http://into-cps.au.dk/

