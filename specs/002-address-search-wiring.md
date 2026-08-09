# Implement address search in web app

In 001-address-lookup.md we created a cloud function to support the address search ballot lookup function.
We want to now wire this into the app.

1. Users will enter their address into the search box and hit enter.
2. The cloud function may take some time to run--10-15s is typical. During this time, we should
display an interstitial with a spinner and a message "Looking up your ballot information"
3. If the function returns with an error, we should stay on the same screen and display the error 
message in an appropriate way, allowing the user to fix their address and retry. Review the code for 
possible error conditions and map to user-friendly messages.
4. If the function succeeds, for now just render the JSON result as a nested table. You should decide based on
Astro architecture/best practice whether this means we forward to another page or we are staying on the
same page and just showing a results state.

As part of this, add a note to the footer that says "Ballot lookup information provided by 
[Mecklenburg Board of Elections](https://vote.mecknc.gov/)"

Ask me any clarifying questions before proceeding.
