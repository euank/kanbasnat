# Kanbasnat - A relay between Hangouts and IRC

This software is meant to bridge a groupchat in Google Hangouts and an IRC channel.
It's seen pretty extensive use at this point.

The dangerous part is the auth (see below).

Figuring out the hangout id also is left as an excersize for the reader at the moment (sorry!).

# Configuration

On the first run, it will ask you via irc (please configure owner!) to follow a link and respond with an OAUTH token for the google account you'll use this with.

**NODE** that the auth information is stored a) in a file in the cwd named `cookies.json` and, in addition, in `/var/lib/kanbasnat/auth.json` if possible.

On each run after the first, if the above file is present that file will be used to auth. If it is not, it will again ask you over irc for the token.
Remember to practice safe SSL when giving google oauth tokens to bots :)

# License

AGPL 3, the maxiumum amount of freedom.
