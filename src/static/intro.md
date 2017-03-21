## The BIP Contact Profile

The ball-in-play profile works off of a fairly simple set of ideas:

Given a single batted ball, if we examine its launch angle and exit velocity, we can figure out the likeliest outcome by examining all other batted balls with a similar launch angle and exit velocity.

## An Example: Let's talk about Jose

Say Jose Ramirez hits a ball with an exit velocity of 97 mph and a launch angle of 10 degrees.  That's a well struck line drive.  There were 134 total recorded batted balls struck at 97mph with a 10 degree launch angle.  94 were singles, 14 were doubles, and 26 were outs.  This gives Jose Ramirez's line drive an _expected wOBA_ of 0.767.    

What if Jose Ramirez rolls over a pitch and hits a grounder at -12 degrees at 84mph?  Of the other 48 batted balls with those characteristics, only 5 were singles, while 1 was a triple.  That gives Jose's ground ball an _expected wOBA_ of 0.121.

When we extend this approach to an entire season of data (taking all of Jose Ramirez's batted balls, and figuring out each _expected wOBA_), we can calculate a player's _expected wOBA_.

Jose Ramirez, if he were to achieve league average results on every ball he hit in 2016, would have ended up with an _expected wOBA_ of 0.366.  We can then compare it to the results he actually got; Jose Ramirez's _actual wOBA_ for all batted balls in 2016 is 0.398.

## What can we learn from those two scores?

The league average BIP wOBA is 0.402; based on Jose's 0.366 _expected wOBA_, when he makes contact we shouldn't expect as good a result as we see from some of his contemporaries.  

But Jose's _actual wOBA_ is better than his _expected wOBA_.  Is this anything more than luck?  Well, maybe. There are specific scenarios which can lead to over or under-performing an _expected wOBA_

## Over-performing and Under-performing Scenarios

Common over-performance scenarios:

- A pull-tendency on fly balls (the fences are closer down the line)
- An even distribution (pull/center/opposite) on ground balls (the defense can't effectively shift)
- Being fast (infield hits, stretching singles to doubles)
- Getting lucky!

Common under-performance scenarios:

- A pull-tendency on ground balls (defensive shifts are effective)
- Hitting a majority of fly-balls to center field (more room for the outfielders to run them down)
- Being slow
- Getting unlucky :(

And home park factors can skew it either way, depending on the match with the hitter

## In Conclusion...

So what's Jose's deal?  Dunno.  But looking at his BIP profile sliced into smaller buckets can be useful.  He outperformed his _expected wOBA_ mostly in the 0-30 degree range and in the 95-105 mph range.  So that means it isn't strictly a legging out infield hits thing, as he outperformed in the 10 - 30 degree buckets. It could be a pulled-fly-ball thing, but I haven't yet broken down the batted ball data into horizontal angle buckets yet.
