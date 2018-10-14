# EBPP
Epic Birding Predicting Project: Predicting good birding near you


This project is currently under development.  
# Edit: Current scoring methods are being developed in Python.  
    In addition to generating "scores" in R, the backend is under construction in MySQL via RDS, and the front end with Node.JS and HTML.  

# EBPP Goals:
# There are a few main functions for the EBPP.   

Search / Reference:
Give date and county, it gives a descending list of species with the highest birb scores AND a descending list of birds with the most change in the last 7 days
-- Graph:  
    Give species and county, it gives a graph of birb scores over a year AND shows the range of dates with the most deviation

# goal GUI methods:

Development of a mobile app is being evaluated.  
--Serve:
    Give your email and county, it sends a daily form covering highest birb scores and species with the most change that day with graphs.  

# calculate birbscore- resulting fields:
  date "%m-%d" | state | county | species | "birbscore"

  Calculate birbscore:
  birbscore for date, state, county, species =
  max (out of 365 dates) mean for date, state, county, species  
    -divided by -
  mean for date, state, county, species



Larger data and test files are stored below:
https://www.amazon.com/clouddrive/share/STVl2Wnxz0EKN2OPjSi99egVKwopWykwkk7Y9BtrzXG

Sources:
This project uses citizen science data (eBird) data to generate statistics.  
eBird Basic Dataset. Version: EBD_relFeb-2017. Cornell Lab of Ornithology, Ithaca, New York. Feb 2017.
