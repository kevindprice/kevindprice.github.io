"""Use the Coriolis math against a wide range of values to produce a graph"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.ticker as mticker

from decimal import *

#The decimal package is necessary to use higher-accuracy numbers.
#Fifteen decimal places is not sufficient; otherwise there are
#errors in the output at about diameter > 100000.

getcontext().prec = 28     #28 decimal places


"""Performs one calculation."""
def calc_diff(diameter, height_start, gs, heightthrown, units = "metric"):
    if units == "metric":
        accel_earth = Decimal("9.80665")
    else:
        accel_earth = Decimal("32.174")

    g_accel = accel_earth * gs              #Gravitational acceleration
    
    radius = diameter / Decimal("2")
    omega = Decimal.sqrt( g_accel / radius )   #rotation rate (radians / second)
    r_oncoin = radius - height_start           #radius "to the coin"
    g_oncoin = omega*omega*r_oncoin            #gravity "on the coin"
    
    #starting velocity components
    start_v_y = Decimal.sqrt ( Decimal("2") * accel_earth * heightthrown )
    start_v_x = Decimal("-1") * Decimal.sqrt( g_oncoin * r_oncoin)
    start_vtotal = Decimal.sqrt( start_v_x**2 + start_v_y**2 )
    
    slope_coin = start_v_y / start_v_x
    
    #Now find the landing coordinates
    sqroot1 = Decimal.sqrt( slope_coin**2 * r_oncoin**2 - ((Decimal("1") + slope_coin**2) * ( r_oncoin**2 - radius**2 )) )
    
    x_2 = ( ( slope_coin * r_oncoin) - sqroot1 ) / ( Decimal("1") + slope_coin**2)
    
    sqroot2 = Decimal.sqrt( r_oncoin**2 - (Decimal("1") + slope_coin**2 ) * ( r_oncoin**2 - radius**2 * slope_coin**2 ) )
    
    y_2 = ( (Decimal("-1") * r_oncoin) + sqroot2 ) / (Decimal("1") + slope_coin**2 )
    
    #Time in the air
    time = Decimal.sqrt( x_2**2 + ( y_2 + r_oncoin )**2 ) / start_vtotal
    
    #Angle person has passed
    theta_traversed_person = omega*time
    initial_angle_person = (Decimal("3") * pi() ) / Decimal("2")
    final_angle_person = initial_angle_person - theta_traversed_person
    
    #Person's final coordinates
    xf_person = radius * cos(final_angle_person)
    yf_person = radius * sin(final_angle_person)
    
    #Find difference
    x_difference = xf_person - x_2
    y_difference = yf_person - y_2
    
    total_difference = Decimal.sqrt( x_difference**2 + y_difference**2 )
    
    return float(total_difference*Decimal("100"))
    
def run():
    answers = []
    loop = 0
    
    #Starting values
    diameter = Decimal("6")
    height_start = Decimal("1.219")
    gs = Decimal("1")
    heightthrown = Decimal("0.914")

    #Loop through many values to generate data.
    while diameter < 100000001:

        try: #Perform one calculation. Catch errors.
            currenttuple = (float(diameter), calc_diff(diameter, height_start, gs, heightthrown, units = "imperial") )
            
            answers.append(currenttuple)

        except InvalidOperation:  #if I purposely decrease the number of decimals
            pass                  #to show how glitchy it is
                                  #then it will produce this error.
                                  #Otherwise this is unnecessary.
        
        loop+=1

        #Stepping over 0.1 increments to a billion is unnecessary and wasteful.
        #I need fewer and fewer datapoints as the diameter increases.
        #I am generating a log graph.
        
        if diameter < 99.9: #A hacky solution to an imprecise decimal comparison.
            diameter += Decimal("0.1")
            
        elif diameter < 1000:
            diameter += Decimal("1.0")
            
        elif diameter < 10000:
            diameter += Decimal("10.0")
            
        elif diameter < 100000:
            diameter += Decimal("100.0")
            
        elif diameter < 1000000:
            diameter += Decimal("1000.0")
        
        elif diameter < 10000000:
            diameter += Decimal("10000.0")

        else:
            diameter += Decimal("100000.0")

    #Generate a dataframe with all the values
    output = pd.DataFrame(answers, columns = ["diameter", "error"])
    output.to_csv("Error Table.csv", index=False)

    #Generate the graph
    fig, ax = plt.subplots()
    ax.set_yscale('log')
    ax.set_xscale('log')
    plt.scatter(output["diameter"],output["error"])
    
    #Set up y-axis labels
    ax.yaxis.set_major_formatter(mticker.ScalarFormatter())
    ax.yaxis.get_major_formatter().set_scientific(False)             #no exponential format
    ax.yaxis.get_major_formatter().set_useOffset(False)              #remove awkward offset in corner
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter('%.1f')) #show labels to 1 decimal

    #x-axis
    ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
    ax.xaxis.get_major_formatter().set_scientific(False)
    ax.xaxis.get_major_formatter().set_useOffset(False)

    ax.get_xaxis().set_major_formatter(
        mticker.FuncFormatter(lambda x, p: format(int(x), ',')))     #Add commas

    fig.canvas.draw()
    labels = [item.get_text() for item in ax.get_yticklabels()]
    labels = [label.replace(".0","") for label in labels]            #Only need decimal for "0.1".
    ax.set_yticklabels(labels)                                       #(remove ".0")
    
    plt.xlabel("Station Diameter (Meters)")
    plt.ylabel("Distance \"Away\" (Centimeters)")
    plt.suptitle("Distance \"Away\" A Tossed Coin Would Land in Artificial Gravity")

    #Rotate the labels
    plt.setp(ax.xaxis.get_majorticklabels(),rotation=40,horizontalalignment='right')
    plt.subplots_adjust(bottom=0.22)
    #plt.show()  #for debugging
    plt.savefig("CoriolisGraph.png")
    plt.close()


#These functions are higher-accuracy than the standard math package.
def pi():
    """Compute Pi to the current precision.

    >>> print(pi())
    3.141592653589793238462643383

    """
    getcontext().prec += 2  # extra digits for intermediate steps
    three = Decimal(3)      # substitute "three=3.0" for regular floats
    lasts, t, s, n, na, d, da = 0, three, 3, 1, 0, 0, 24
    while s != lasts:
        lasts = s
        n, na = n+na, na+8
        d, da = d+da, da+32
        t = (t * n) / d
        s += t
    getcontext().prec -= 2
    return +s               # unary plus applies the new precision

def cos(x):
    """Return the cosine of x as measured in radians.

    The Taylor series approximation works best for a small value of x.
    For larger values, first compute x = x % (2 * pi).

    >>> print(cos(Decimal('0.5')))
    0.8775825618903727161162815826
    >>> print(cos(0.5))
    0.87758256189
    >>> print(cos(0.5+0j))
    (0.87758256189+0j)

    """
    getcontext().prec += 2
    i, lasts, s, fact, num, sign = 0, 0, 1, 1, 1, 1
    while s != lasts:
        lasts = s
        i += 2
        fact *= i * (i-1)
        num *= x * x
        sign *= -1
        s += num / fact * sign
    getcontext().prec -= 2
    return +s

def sin(x):
    """Return the sine of x as measured in radians.

    The Taylor series approximation works best for a small value of x.
    For larger values, first compute x = x % (2 * pi).

    >>> print(sin(Decimal('0.5')))
    0.4794255386042030002732879352
    >>> print(sin(0.5))
    0.479425538604
    >>> print(sin(0.5+0j))
    (0.479425538604+0j)

    """
    getcontext().prec += 2
    i, lasts, s, fact, num, sign = 1, 0, x, 1, x, 1
    while s != lasts:
        lasts = s
        i += 2
        fact *= i * (i-1)
        num *= x * x
        sign *= -1
        s += num / fact * sign
    getcontext().prec -= 2
    return +s


    
if __name__=="__main__":
    run()