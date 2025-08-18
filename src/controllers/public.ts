import { Request, Response } from "express";
import { BookListing } from "../models/BookListing";
import { School } from "../models/School";
import { User } from "../models/User";
import moment from "moment";

/**
 * Publiczny dashboard z anonimizowanymi statystykami
 */
export const getPublicDashboard = async (req: Request, res: Response) => {
  try {
    // Podstawowe statystyki bez danych osobowych
    const totalStats = await BookListing.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          soldBooks: {
            $sum: { $cond: [{ $in: ["$status", ["sold", "given_money"]] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                { $add: ["$cost", "$commission"] },
                0
              ]
            }
          },
          totalCommission: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                "$commission",
                0
              ]
            }
          }
        }
      }
    ]);

    // Statystyki per szkoła (bez identyfikacji konkretnych szkół)
    const schoolStats = await BookListing.aggregate([
      {
        $group: {
          _id: "$school",
          totalBooks: { $sum: 1 },
          soldBooks: {
            $sum: { $cond: [{ $in: ["$status", ["sold", "given_money"]] }, 1, 0] }
          },
          revenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                { $add: ["$cost", "$commission"] },
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "school"
        }
      },
      {
        $project: {
          schoolName: { $arrayElemAt: ["$school.name", 0] },
          totalBooks: 1,
          soldBooks: 1,
          revenue: 1,
          sellRate: {
            $multiply: [
              { $divide: ["$soldBooks", "$totalBooks"] },
              100
            ]
          }
        }
      }
    ]);

    // Trendy czasowe (ostatnie 30 dni)
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    const dailyStats = await BookListing.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          registered: { $sum: 1 },
          sold: {
            $sum: { $cond: [{ $in: ["$status", ["sold", "given_money"]] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.render("public/dashboard", {
      title: "Transparentność Targów Książkowych",
      layout: "public/layout",
      stats: totalStats[0] || {
        totalBooks: 0,
        soldBooks: 0,
        totalRevenue: 0,
        totalCommission: 0
      },
      schools: schoolStats,
      dailyTrends: dailyStats,
      lastUpdate: new Date(),
      sellRate: totalStats[0] ? 
        ((totalStats[0].soldBooks / totalStats[0].totalBooks) * 100).toFixed(1) : 
        "0"
    });

  } catch (error) {
    console.error("Error in public dashboard:", error);
    res.status(500).render("public/error", {
      title: "Błąd",
      error: "Wystąpił błąd podczas ładowania danych"
    });
  }
};

/**
 * Open Data API - dane w formacie JSON dla zewnętrznych aplikacji
 */
export const getOpenDataAPI = async (req: Request, res: Response) => {
  try {
    const format = req.query.format || 'json';
    
    // Zagregowane dane publiczne
    const aggregatedData = await BookListing.aggregate([
      {
        $group: {
          _id: "$school",
          totalBooks: { $sum: 1 },
          soldBooks: {
            $sum: { $cond: [{ $in: ["$status", ["sold", "given_money"]] }, 1, 0] }
          },
          activeBooks: {
            $sum: { $cond: [{ $in: ["$status", ["registered", "printed_label", "accepted"]] }, 1, 0] }
          },
          totalValue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                { $add: ["$cost", "$commission"] },
                0
              ]
            }
          },
          commission: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                "$commission",
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo"
        }
      },
      {
        $project: {
          school: {
            name: { $arrayElemAt: ["$schoolInfo.name", 0] },
            // Nie publikujemy adresów i innych szczegółów
          },
          statistics: {
            totalBooks: "$totalBooks",
            soldBooks: "$soldBooks", 
            activeBooks: "$activeBooks",
            sellRate: {
              $multiply: [
                { $divide: ["$soldBooks", "$totalBooks"] },
                100
              ]
            },
            totalValue: "$totalValue",
            commission: "$commission"
          }
        }
      }
    ]);

    // Dodaj metadata
    const response = {
      meta: {
        version: "1.0.0",
        generated: new Date().toISOString(),
        description: "Open data API for school book fairs transparency",
        license: "CC BY 4.0",
        contact: "samorzad@elektryk.opole.pl",
        updateFrequency: "daily",
        dataTypes: ["financial", "operational", "statistical"],
        coverage: {
          temporal: "real-time",
          geographic: "Poland"
        }
      },
      summary: {
        totalSchools: aggregatedData.length,
        totalBooks: aggregatedData.reduce((sum: number, school: any) => sum + school.statistics.totalBooks, 0),
        totalSold: aggregatedData.reduce((sum: number, school: any) => sum + school.statistics.soldBooks, 0),
        totalValue: aggregatedData.reduce((sum: number, school: any) => sum + school.statistics.totalValue, 0)
      },
      data: aggregatedData
    };

    // Format odpowiedzi
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=book_fairs_opendata.csv');
        
        const csv = convertToCSV(aggregatedData);
        return res.send(csv);

      case 'xml':
        res.setHeader('Content-Type', 'application/xml');
        const xml = convertToXML(response);
        return res.send(xml);

      default: // json
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*'); // CORS dla open data
        return res.json(response);
    }

  } catch (error) {
    console.error("Error in open data API:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Unable to retrieve open data",
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Endpoint dla konkretnej szkoły (anonimizowany)
 */
export const getSchoolStats = async (req: Request, res: Response) => {
  try {
    const schoolId = req.params.schoolId;
    
    const schoolData = await BookListing.aggregate([
      { $match: { school: schoolId } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          soldBooks: {
            $sum: { $cond: [{ $in: ["$status", ["sold", "given_money"]] }, 1, 0] }
          },
          pendingBooks: {
            $sum: { $cond: [{ $eq: ["$status", "registered"] }, 1, 0] }
          },
          revenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["sold", "given_money"]] },
                { $add: ["$cost", "$commission"] },
                0
              ]
            }
          }
        }
      }
    ]);

    const school = await School.findById(schoolId, 'name');
    
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({
      school: { name: school.name },
      statistics: schoolData[0] || {
        totalBooks: 0,
        soldBooks: 0, 
        pendingBooks: 0,
        revenue: 0
      },
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error("Error getting school stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Endpoint z trendami czasowymi
 */
export const getTimeSeriesData = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = moment().subtract(days, 'days').toDate();

    const timeSeriesData = await BookListing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          statusCounts: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          totalForDay: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      meta: {
        period: `${days} days`,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      data: timeSeriesData
    });

  } catch (error) {
    console.error("Error getting time series data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper functions
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = [
    'School Name',
    'Total Books', 
    'Sold Books',
    'Active Books',
    'Sell Rate %',
    'Total Value',
    'Commission'
  ];
  
  const rows = data.map(item => [
    item.school.name,
    item.statistics.totalBooks,
    item.statistics.soldBooks,
    item.statistics.activeBooks, 
    item.statistics.sellRate.toFixed(2),
    item.statistics.totalValue.toFixed(2),
    item.statistics.commission.toFixed(2)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function convertToXML(data: any): string {
  // Prosta konwersja do XML - można użyć biblioteki xml2js dla bardziej zaawansowanych przypadków
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<opendata>\n';
  xml += `  <meta>\n`;
  xml += `    <version>${data.meta.version}</version>\n`;
  xml += `    <generated>${data.meta.generated}</generated>\n`;
  xml += `    <description>${data.meta.description}</description>\n`;
  xml += `  </meta>\n`;
  xml += `  <summary>\n`;
  xml += `    <totalSchools>${data.summary.totalSchools}</totalSchools>\n`;
  xml += `    <totalBooks>${data.summary.totalBooks}</totalBooks>\n`;
  xml += `    <totalSold>${data.summary.totalSold}</totalSold>\n`;
  xml += `    <totalValue>${data.summary.totalValue}</totalValue>\n`;
  xml += `  </summary>\n`;
  xml += `  <schools>\n`;
  
  data.data.forEach((school: any) => {
    xml += `    <school>\n`;
    xml += `      <name>${school.school.name}</name>\n`;
    xml += `      <statistics>\n`;
    xml += `        <totalBooks>${school.statistics.totalBooks}</totalBooks>\n`;
    xml += `        <soldBooks>${school.statistics.soldBooks}</soldBooks>\n`;
    xml += `        <sellRate>${school.statistics.sellRate}</sellRate>\n`;
    xml += `        <totalValue>${school.statistics.totalValue}</totalValue>\n`;
    xml += `      </statistics>\n`;
    xml += `    </school>\n`;
  });
  
  xml += `  </schools>\n`;
  xml += '</opendata>';
  
  return xml;
}
