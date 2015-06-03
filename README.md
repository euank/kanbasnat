# Kanbasnat - A relay between Hangouts and IRC

This is a work in progress. It should currently not be used for anything other than development.

# Configuration

On the first run it will prompt you to follow a link and enter the OAUTH token for the google account you'll be using for this. The rest of the config.json example is pretty self explanatory.

**NOTE** that the auth information from the first run is currently stored in `./node_modules/hangupsjs/cookies.json`, and so you should treat your `node_modules` folder as containing sensitive information. This location will likely change soon.

# License

AGPL 3, the maxiumum amount of freedom.
