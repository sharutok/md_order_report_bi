const moment = require("moment")
const { NORMAL_ORACLE_MASTER_PROD } = require("../Connection/oracleconf")
const { pgConnect } = require("../Connection/pgsqlconf")
const { sales_data_for_last_six_months, sales_data_for_all_and_different_region_all_distributors_top_20_distributors, sales_data_for_all_and_different_region_all_distributors, get_customer_id_group_by_region } = require("../queries/oracle-queries")
const _month = require("../utils")
const { approved_and_rejected_for_last_6_months, approved_and_rejected_region_wise } = require("../queries/pg-queries")
const { performance } = require("perf_hooks");
const fs = require('fs');
exports.collect_data_from_oracle = async (req, res) => {
    let data1 = []
    let data2 = []
    let data3 = []

    try {
        // for all distributors
        await Promise.all(["", "North", "South", "West", "East", "Central"].map(async (val) => {
            const a_data = await NORMAL_ORACLE_MASTER_PROD(sales_data_for_all_and_different_region_all_distributors(val))
            data1.push({
                "region": val || "All",
                "data": a_data[0]
            })
        }))

        //for top 20 distributors
        await Promise.all(["", "North", "South", "West", "East", "Central"].map(async (val) => {
            const b_data = await NORMAL_ORACLE_MASTER_PROD(sales_data_for_all_and_different_region_all_distributors_top_20_distributors(val))
            data2.push({
                "region": val || "All",
                "data": b_data[0]
            })
        }))

        await Promise.all(past_six.map(async (data) => {
            const c_data = await NORMAL_ORACLE_MASTER_PROD(sales_data_for_last_six_months(data.start_date, data.end_date))
            data3.push({
                "month": moment(data.start_date).format("MMMM YYYY"),
                "data": c_data[0]
            })
        }))

        let data = { "all_distributors": data1, "top_20": data2, "month_wise": data3 }
        return data
    } catch (error) {
        console.log(error);
    }
}

exports.collect_data_from_pgsql = async (req, res) => {
    let formatted_past_six = []

    past_six.map(x => {
        formatted_past_six.push(moment(x.start_date, "YYYY-MM-DD").format("MM-YYYY"))
    })
    const approved_data = await pgConnect(approved_and_rejected_for_last_6_months('Approved', formatted_past_six))
    const rejected_data = await pgConnect(approved_and_rejected_for_last_6_months('Rejected', formatted_past_six))

    const result = {
        approved_data: approved_data,
        rejected_data: rejected_data,
    }
    return result

}

exports.collect_data_from_both = async (req, res) => {
    const d_data = await NORMAL_ORACLE_MASTER_PROD(get_customer_id_group_by_region())
    const currated_data = await Promise.all(d_data.map(x => {
        return ({ REGION: x.REGION, LIST_OF_DISTRIBUTOR_ID: x.LIST_OF_DISTRIBUTOR_ID.split(",") });
    }))

    const result = await Promise.all(currated_data.map(async (cd) => {
        const _data = await pgConnect(approved_and_rejected_region_wise(formatted_past_six = cd.LIST_OF_DISTRIBUTOR_ID))
        return ({
            region: cd.REGION,
            data: _data
        });
    }))
    return { result }
}

exports.collect_data = async (req, res) => {
    try {
        const start_time = performance.now()
        console.log(`Started at ${moment().format("DD-MM-YYYY hh:mm:ss")}`);
        const p_data = await this.collect_data_from_pgsql()
        const o_data = await this.collect_data_from_oracle()
        const b_data = await this.collect_data_from_both()
        const result = await Promise.all([o_data, p_data, b_data].map(x => {
            return x
        }))
        const formatted_result = format_data(result)
        const end_time = performance.now()
        console.log(`took ${Math.round(end_time - start_time) / 1000}secs`);
        // fs.writeFileSync('myjsonfile.json', JSON.stringify(formatted_result));
        res.json(formatted_result)
        // res.json(result)

    } catch (error) {
        console.log(error);
    }

}

let past_six = []
Array.from(Array(6).keys()).map(async (z) => {
    const start_date = `${moment().subtract(z, "months").format("YYYY-MM-")}01`
    const end_date = `${moment().subtract(z, "months").format("YYYY-MM-")}${_month[moment().subtract(z, "months").format("MM")]}`
    past_six.push({ "start_date": start_date, "end_date": end_date });
});



function format_data(data) {
    let formatted_data = {
        "Trade:Trade EUB Ratio – All India": [],
        "Trade:Trade EUB Ratio – Regionwise": [],
        "Last 6 months – Trade:Trade EUB Ratio – Top 20 Distributors from each Region": [],
        "Last months Trade Value: Trade EUb Value Monthly": [],
        "Past 6 Months": [],
        "Average number of Trade EUB orders that are approved and rejected monthly": [],
        "Region List": [],
        "Data of ratio of approved :disapproved Tarde EUb orders – Regionwise": []

    }

    data[0]?.all_distributors.map(x => {
        if (x?.region === "All") {
            formatted_data["Trade:Trade EUB Ratio – All India"] = x.data;
        }
        else {
            formatted_data["Trade:Trade EUB Ratio – Regionwise"].push({ region: x.region, data: x.data });
        }
    })

    data[0]?.top_20.map(x => {
        if (x?.region !== "All") {
            formatted_data["Last 6 months – Trade:Trade EUB Ratio – Top 20 Distributors from each Region"].push({ region: x.region, data: x.data });
        }
    })

    formatted_data['Last months Trade Value: Trade EUb Value Monthly'] = data[0]?.month_wise

    formatted_data['Past 6 Months'] = past_six.map(x => {
        return moment(x.start_date).format("MMMM YYYY")
    })

    data[1]?.approved_data.map(x => {
        if (x?.region !== "All") {
            formatted_data["Last 6 months – Trade:Trade EUB Ratio – Top 20 Distributors from each Region"].push({ region: x.region, data: x.data });
        }
    })

    formatted_data['Average number of Trade EUB orders that are approved and rejected monthly'] = [{
        approved_data: data[1].approved_data,
        rejected_data: data[1].rejected_data,
    }]

    formatted_data["Region List"] = ["North", "South", "West", "East", "Central"]
    formatted_data["Data of ratio of approved :disapproved Tarde EUb orders – Regionwise"] = data[2].result

    return formatted_data
}