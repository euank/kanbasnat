# Kanbasnat - A relay between Hangouts and IRC

This software is meant to bridge a groupchat in Google Hangouts and an IRC channel.
It's seen pretty extensive use at this point.

The dangerous part is the auth (see below).

Figuring out the hangout id also is left as an exercise for the reader at the moment (sorry!).

It's recommended that you run this sucker as a docker container. For example, you can use the following:

```
docker run -e nick=nickname -e channel="#kanbasnat" -e hangoutId=XXXX -e owner=me -e port=6697 -e host=irc.freenode.net -e secureCert=true euank/kanbasnat
```

# Configuration

On the first run, it will ask you via IRC (please configure owner!) to follow a link and respond with an OAuth token for the Google account you'll use this with.

**NOTE** that the auth information is stored a) in a file named `cookies.json` in `/var/lib/kanbasnat/cookies.json` if possible b) A file at `./node_modules/hangupsjs/refreshtoken.txt` if possible.
Those files should be kept secret and handled with utmost care (if you care about that Google account in question).

On each run after the first, if the above file is present that file will be used to auth. If it is not, it will again ask you over IRC for the token.
Remember to practice safe SSL when giving Google OAuth tokens to bots :)

# License

AGPL 3, the maximum amount of freedom.
