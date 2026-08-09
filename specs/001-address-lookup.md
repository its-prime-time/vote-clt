# Address lookup for VoteCLT.org

We need to implement ballot lookup by address for VoteCLT.org.
To do this, we will take advantage of some utilitarian web pages set up
by the Mecklenburg board of elections. Basically we want one or more Typescript
cloud functions to proxy requests to the back end service and format results in a
way that they can be attractively rendered by our front-end.

The typical steps are:
1. Visit https://apps.meckboe.org/addressSearch_New.aspx
2. Enter the street address (note the strict structure into number, street and street type)
3. Confirm that there is a single result row that comes back. If there is more than one,
   or a failure, we will need to ask the user to try with a different address or visit the BOE site directly to resolve
4. If there is a single result row, then we can invoke the second, dynamic URL, for example:
   https://apps.meckboe.org/AddressSearchReturn_New.aspx?SN=PLANTERS%20RIDGE&HN=3227&OEN=O&SD=&ST=RD&SS=&ZC=28270

We want to fully automate this process and make it robust against errors.
For starters, we want the user to just enter their street address into a single
field (more user friendly and accessible). When the user submits, we want to fully
proxy/automate the interactions with the BOE web page, and, if successful, pull
out all of the structured data from the page, even if we don't display it all,
and return it as JSON.

Since we are allowing the user to enter just a street address into a single line,
we will need to break this up. We should use whatever Firebase's best gen AI approach
to this is, creating a prompt to break the address into house number, street, and
street type, giving the AI a few examples. Users might enter apartments or zip codes
which we can ignore. If the AI parses correctly into the structure, we can go onto
the next step, otherwise we can error with an unrecognized address format message.

When we get those three elements, submit to the first form on the backend. The target
site does not appear to be using bot detection or anti-csrf, etc. (you can verify)
so that we can just post directly to the form target. We should get back a page
with a single link (see the samples in the sample directory). If we get back
no addresses we can error with an address not found error message. If we get back
multipe addresses we can error with a multiple addresses error message--including
the rendered links so that these can be displayed to the user to disambiguate.

When we have one link, go ahead and access the dynamic URL. We then want to scrape
all of the relevant information off of it and return as JSON to present to the caller.

Include a command line harness for the cloud function so that we can invoke it via
command line. Once we're satisfied with the function we will wire it into the
rest of the application.

General:
- Use the latest recommended approaches, libraries, code structure for Firebase
  cloud functions in Typescript
- Use Firebase GenAI constructs as appropriate to pull out the address information.
- Use modern typescript best practices. Single responsibility functions. Classes
  if it makes sense. Basically structure for clarity and maintainability of code,
  at the expense of a little more structure or lines of code.
- The team is not very familiar with Typescript
  so be a little more verbose in your comments than you might normally.
- Ask any clarifying questions before proceeding
- Create a PR when finished
   
