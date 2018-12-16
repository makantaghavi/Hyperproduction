from datetime import datetime
import matplotlib.pyplot as plt
import dateutil.parser
import numpy as np

import json

import sys

f = open(sys.argv[1])

start = None
if len(sys.argv) > 2:
    start = int(sys.argv[2])
end = None
if len(sys.argv) > 3:
    end = int(sys.argv[3])

accTime = np.array([])
accXVals = np.array([])
accYVals = np.array([])
accZVals = np.array([])

c = 0
startTs = None
for l in f:
    j = json.loads(l)
    d = dateutil.parser.parse(j["timestamp"])
    if startTs is None:
        startTs = d
    if "accelerometer" in j:
        if j["id"] == 0:
            c += 1
            accTime = np.append(accTime, (d - startTs).total_seconds())
            accXVals = np.append(accXVals, j["orientation"]["x"])
            accYVals = np.append(accYVals, j["orientation"]["y"])
            accZVals = np.append(accZVals, j["orientation"]["z"])

print len(accTime)

plt.plot(accTime, accXVals, 'b', alpha=0.3, lw=.3, marker='.')
plt.plot(accTime, accYVals, 'r', alpha=0.3, lw=.3, marker='.')
plt.plot(accTime, accZVals, 'g', alpha=0.3, lw=.3, marker='.')
plt.savefig('plot.ps')
plt.show()


