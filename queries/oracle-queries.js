const moment = require("moment")

exports.sales_data_for_all_and_different_region_all_distributors = (logic_dates, val) => {
	const { start_date, end_date } = logic_dates
	return `
            SELECT sum(TRADEORDERVALUE) TRADE_ORDER_VALUE,
		sum(EUBVALUE) EUB_ORDER_VALUE,
		sum(TOTALORDER) TOTAL_ORDER_VALUE,
		round(sum(TRADEORDERVALUE) / sum(TOTALORDER),2) TRADE_ORDER_RATIO,
		round(sum(EUBVALUE) / sum(TOTALORDER),2) EUB_ORDER_RATIO
		from(
SELECT
	nvl(a.PRO_CUST, b.PRO_CUST) Customer_Number ,
	nvl(a.PRO_CUST_NAME, b.PRO_CUST_NAME) Customer_Name ,
	nvl(a.OrderType, 'Trade Order') TradeOrder ,
	nvl(a.OrderValue, 0) TradeOrderValue ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) EUBValue ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
			AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
				AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST(+)= b.PRO_CUST
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue
UNION
SELECT
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	nvl(a.OrderType, 'Trade Order') ,
	nvl(a.OrderValue, 0) ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou ,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
				AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST = b.PRO_CUST(+)
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue)
tabl WHERE 
tabl.Region LIKE '%${val}%' 
`
}

exports.sales_data_for_all_and_different_region_all_distributors_top_20_distributors = (logic_dates, val) => {
	const { start_date, end_date } = logic_dates
	return `
            SELECT sum(TRADEORDERVALUE) TRADE_ORDER_VALUE,
		sum(EUBVALUE) EUB_ORDER_VALUE,
		sum(TOTALORDER) TOTAL_ORDER_VALUE,
		round(sum(TRADEORDERVALUE) / sum(TOTALORDER),2) TRADE_ORDER_RATIO,
		round(sum(EUBVALUE) / sum(TOTALORDER),2) EUB_ORDER_RATIO
		from(
SELECT
	nvl(a.PRO_CUST, b.PRO_CUST) Customer_Number ,
	nvl(a.PRO_CUST_NAME, b.PRO_CUST_NAME) Customer_Name ,
	nvl(a.OrderType, 'Trade Order') TradeOrder ,
	nvl(a.OrderValue, 0) TradeOrderValue ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) EUBValue ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
			AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
				AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST(+)= b.PRO_CUST
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue
UNION
SELECT
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	nvl(a.OrderType, 'Trade Order') ,
	nvl(a.OrderValue, 0) ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou ,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
				AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST = b.PRO_CUST(+)
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue)
tabl WHERE 
rownum <=20 and
tabl.Region LIKE '%${val}%' 
`
}

exports.sales_data_for_last_six_months = (logic_dates) => {
	const { start_date, end_date } = logic_dates
	return `
            SELECT sum(TRADEORDERVALUE) TRADE_ORDER_VALUE,
		sum(EUBVALUE) EUB_ORDER_VALUE,
		sum(TOTALORDER) TOTAL_ORDER_VALUE,
		round(sum(TRADEORDERVALUE) / sum(TOTALORDER),2) TRADE_ORDER_RATIO,
		round(sum(EUBVALUE) / sum(TOTALORDER),2) EUB_ORDER_RATIO
		from(
SELECT
	nvl(a.PRO_CUST, b.PRO_CUST) Customer_Number ,
	nvl(a.PRO_CUST_NAME, b.PRO_CUST_NAME) Customer_Name ,
	nvl(a.OrderType, 'Trade Order') TradeOrder ,
	nvl(a.OrderValue, 0) TradeOrderValue ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) EUBValue ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
			AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
				AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST(+)= b.PRO_CUST
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue
UNION
SELECT
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	nvl(a.OrderType, 'Trade Order') ,
	nvl(a.OrderValue, 0) ,
	nvl(b.OrderType, 'Trade EUB') TradeEUB ,
	nvl(b.OrderValue, 0) ,
	sum(nvl(a.OrderValue, 0)+ nvl(b.OrderValue, 0)) TotalOrder ,
	(
	SELECT
		decode(t.TERRITORY_CODE, 'S', 'South' , 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central' , t.TERRITORY_CODE) Region
	FROM
		(
		SELECT
			rs.salesrep_number,
			rs.SALESREP_ID,
			(
			SELECT
				decode(SEGMENT4, '41', 'C', '42', 'C', segment1)
			FROM
				apps.ra_territories
			WHERE
				TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE
		FROM
			apps.jtf_rs_salesreps rs,
			apps.JTF_RS_RESOURCE_EXTNS_VL RES,
			apps.hr_organization_units hou ,
			apps.ra_salesrep_territories rst
		WHERE
			hou.organization_id = rs.org_id
			AND rs.salesrep_number <> '421'
			AND rs.resource_id = res.resource_id
			AND rs.SALESREP_ID = rst.SALESREP_ID
			AND (res.END_DATE_ACTIVE IS NULL
				OR res.END_DATE_ACTIVE >= sysdate-180)
			AND (rst.END_DATE_ACTIVE IS NULL
				OR rst.END_DATE_ACTIVE >= sysdate-180)
			AND rs.salesrep_id IN (
			SELECT
				ooha.SALESREP_ID
			FROM
				apps.hz_cust_accounts hca ,
				apps.oe_order_headers_all ooha
			WHERE
				1 = 1
				AND hca.cust_Account_id = sold_to_org_id
				AND ooha.order_source_id = 1003
				AND account_number = nvl(a.PRO_CUST, b.PRO_CUST))
				AND rownum<2) t
	GROUP BY
		t.TERRITORY_CODE) Region
FROM
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade Order') a ,
	(
	SELECT
		t1.PRO_CUST ,
		t1.PRO_CUST_NAME ,
		t1.OrderType ,
		t1.OrderValue
	FROM
		(
		SELECT
			t.PRO_CUST ,
			t.PRO_CUST_NAME ,
			decode(t.Order_type, 'B', 'Trade Order', 'C', 'Trade EUB', t.Order_type) OrderType ,
			sum(t.PRO_NETVL_WITH_DIS) OrderValue
		FROM
			(
			SELECT
				prom.PRO_NETVL_WITH_DIS,
				prom.PRO_LAC,
				prom.PRO_CUST ,
				prom.PRO_ORDER_NUMBER ,
				prom.PRO_CUST_NAME ,
				(
				SELECT
					ATTRIBUTE17
				FROM
					apps.oe_order_headers_all
				WHERE
					order_number = prom.PRO_ORDER_NUMBER
					AND header_id = prom.PRO_HEADER_ID) Order_type
			FROM
				promast prom
			WHERE
				1 = 1
				AND prom.PRO_BV_CODE IN ('TRADE')
					AND TRUNC(PRO_DT) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE)))t
		GROUP BY
			t.PRO_CUST,
			t.Order_type ,
			t.PRO_CUST_NAME)t1
	WHERE
		t1.OrderType = 'Trade EUB') b
WHERE
	a.PRO_CUST = b.PRO_CUST(+)
GROUP BY
	a.PRO_CUST ,
	a.PRO_CUST_NAME ,
	a.OrderType ,
	a.OrderValue ,
	b.PRO_CUST ,
	b.PRO_CUST_NAME ,
	b.OrderType ,
	b.OrderValue)
tabl
`
}

exports.get_customer_id_group_by_region = () => {
	return `SELECT 
tab1.REGION ,LISTAGG(tab1.ACCOUNT_NUMBER,',') WITHIN GROUP (ORDER BY tab1.ACCOUNT_NUMBER) AS LIST_OF_DISTRIBUTOR_ID
from(
SELECT DISTINCT ACCOUNT_NUMBER ,REGION FROM (select nvl(a.Account_Number,b.Account_Number)  ACCOUNT_NUMBER,nvl(a.region,b.region)REGION               
from           
(select distinct
inv.CUST_ACCOUNT_NUMBER  Account_Number
,inv.CUST_ACCOUNT_NAME   Customer_Name
,sum(afid.LINE_AMOUNT)    amt
,adsih.CUST_CLASSIFICATION_MEANING
,rn.region
from  apps.awl_falcon_invoice_header inv
     ,awl_FALCON.AWL_FALCON_invoice_details afid
     ,apps.wsh_new_deliveries  wnd
     ,apps.awl_falcon_sales_indent_lines  afsil
     ,apps.awl_falcon_sales_indent_headers adsih
     ,( SELECT t.salesrep_number, decode(t.TERRITORY_CODE, 'S', 'South', 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central', t.TERRITORY_CODE) Region FROM ( SELECT rs.salesrep_number, ( SELECT decode(SEGMENT4, '41', 'C', '42', 'C', segment1) FROM apps.ra_territories WHERE TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE FROM apps.jtf_rs_salesreps rs, apps.JTF_RS_RESOURCE_EXTNS_VL RES, apps.hr_organization_units hou , apps.ra_salesrep_territories rst WHERE hou.organization_id = rs.org_id AND rs.salesrep_number <> '421' AND rs.resource_id = res.resource_id AND rs.SALESREP_ID = rst.SALESREP_ID AND (res.END_DATE_ACTIVE IS NULL OR res.END_DATE_ACTIVE >= sysdate-180) AND (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE >= sysdate-180) ORDER BY rs.org_id DESC) t GROUP BY t.salesrep_number, t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
group by inv.CUST_ACCOUNT_NUMBER  
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) a,
(select distinct
inv.CUST_ACCOUNT_NUMBER  Account_Number
,inv.CUST_ACCOUNT_NAME   Customer_Name
,sum(afid.LINE_AMOUNT) AMOUNT    
,adsih.CUST_CLASSIFICATION_MEANING
,rn.region
from  apps.awl_falcon_invoice_header inv
     ,awl_FALCON.AWL_FALCON_invoice_details afid
     ,apps.wsh_new_deliveries  wnd
     ,apps.awl_falcon_sales_indent_lines  afsil
     ,apps.awl_falcon_sales_indent_headers adsih
     ,( SELECT t.salesrep_number, decode(t.TERRITORY_CODE, 'S', 'South', 'E', 'East' , 'N', 'North' , 'W', 'West' , 'C', 'Central', t.TERRITORY_CODE) Region FROM ( SELECT rs.salesrep_number, ( SELECT decode(SEGMENT4, '41', 'C', '42', 'C', segment1) FROM apps.ra_territories WHERE TERRITORY_ID = rst.TERRITORY_ID) TERRITORY_CODE FROM apps.jtf_rs_salesreps rs, apps.JTF_RS_RESOURCE_EXTNS_VL RES, apps.hr_organization_units hou , apps.ra_salesrep_territories rst WHERE hou.organization_id = rs.org_id AND rs.salesrep_number <> '421' AND rs.resource_id = res.resource_id AND rs.SALESREP_ID = rst.SALESREP_ID AND (res.END_DATE_ACTIVE IS NULL OR res.END_DATE_ACTIVE >= sysdate-180) AND (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE >= sysdate-180) ORDER BY rs.org_id DESC) t GROUP BY t.salesrep_number, t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB') 
AND  rn.salesrep_number=adsih.SALESREP_ID
group by inv.CUST_ACCOUNT_NUMBER  
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number=b.Account_Number
Order BY a.Account_Number,b.Account_Number DESC) xyz) tab1 GROUP BY tab1.REGION`
}



/*
"01-2023" //MM-YYYY
"09-2023" //MM-YYYY

"01-01-2023"
"01-09-2023"
*/