const moment = require("moment")

exports.sales_data_for_all_and_different_region_all_distributors = (val) => {
       return `
	select sum(t1.TRADE_ORDER_VALUE) TRADE_ORDER_VALUE
,sum(t1.EUB_ORDER_VALUE) EUB_ORDER_VALUE
,sum(t1.TOTAL_ORDER_VALUE) TOTAL_ORDER_VALUE
,round(sum(nvl(t1.TRADE_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) TRADE_ORDER_VALUE_RATIO
,round(sum(nvl(t1.EUB_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) EUB_ORDER_VALUE_RATIO
from (select t.AccountNumber  ACCOUNT_NUMBER
       ,t.CustomerName  CUSTOMER_NAME
       ,t.TradeOrderValue  TRADE_ORDER_VALUE
       ,t.EUBOrderValue    EUB_ORDER_VALUE
       ,t.TotalOrderValue  TOTAL_ORDER_VALUE
       ,t.Region           REGION
From
 (select    nvl(a.Account_Number,b.Account_Number)  AccountNumber
           ,nvl(a.Customer_Name,b.Customer_Name) CustomerName
           ,nvl(a.amt,0) TradeOrderValue
           ,nvl(b.AMOUNT,0) EUBOrderValue
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) TotalOrderValue
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number=b.Account_Number(+)
UNION ALL
select    nvl(a.Account_Number,b.Account_Number)  "Account Number"
           ,nvl(a.Customer_Name,b.Customer_Name) "Customer Name"
           ,nvl(a.amt,0) "Trade Order Value"
           ,nvl(b.AMOUNT,0) "EUB Order Value"
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) "Total Order Value"
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number(+)=b.Account_Number) t
where t.Region LIKE '%${val}%'     
--AND   rownum<21            
group by t.AccountNumber
       ,t.CustomerName
       ,t.TradeOrderValue
       ,t.EUBOrderValue
       ,t.TotalOrderValue
       ,t.Region
Order by t.TotalOrderValue ) t1`
}

exports.sales_data_for_all_and_different_region_all_distributors_top_20_distributors = (val) => {
       return `
	select sum(t1.TRADE_ORDER_VALUE) TRADE_ORDER_VALUE
,sum(t1.EUB_ORDER_VALUE) EUB_ORDER_VALUE
,sum(t1.TOTAL_ORDER_VALUE) TOTAL_ORDER_VALUE
,round(sum(nvl(t1.TRADE_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) TRADE_ORDER_VALUE_RATIO
,round(sum(nvl(t1.EUB_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) EUB_ORDER_VALUE_RATIO
from (select t.AccountNumber  ACCOUNT_NUMBER
       ,t.CustomerName  CUSTOMER_NAME
       ,t.TradeOrderValue  TRADE_ORDER_VALUE
       ,t.EUBOrderValue    EUB_ORDER_VALUE
       ,t.TotalOrderValue  TOTAL_ORDER_VALUE
       ,t.Region           REGION
From
 (select    nvl(a.Account_Number,b.Account_Number)  AccountNumber
           ,nvl(a.Customer_Name,b.Customer_Name) CustomerName
           ,nvl(a.amt,0) TradeOrderValue
           ,nvl(b.AMOUNT,0) EUBOrderValue
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) TotalOrderValue
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number=b.Account_Number(+)
UNION ALL
select    nvl(a.Account_Number,b.Account_Number)  "Account Number"
           ,nvl(a.Customer_Name,b.Customer_Name) "Customer Name"
           ,nvl(a.amt,0) "Trade Order Value"
           ,nvl(b.AMOUNT,0) "EUB Order Value"
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) "Total Order Value"
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN  (SYSDATE - 180) AND  TRUNC(SYSDATE-1)
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number(+)=b.Account_Number) t
where t.Region LIKE '%${val}%'     
AND   rownum<=20
group by t.AccountNumber
       ,t.CustomerName
       ,t.TradeOrderValue
       ,t.EUBOrderValue
       ,t.TotalOrderValue
       ,t.Region
Order by t.TotalOrderValue ) t1`
}

exports.sales_data_for_last_six_months = (start_date, end_date) => {
       return `
	select sum(t1.TRADE_ORDER_VALUE) TRADE_ORDER_VALUE
,sum(t1.EUB_ORDER_VALUE) EUB_ORDER_VALUE
,sum(t1.TOTAL_ORDER_VALUE) TOTAL_ORDER_VALUE
,round(sum(nvl(t1.TRADE_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) TRADE_ORDER_VALUE_RATIO
,round(sum(nvl(t1.EUB_ORDER_VALUE, 0)) / sum(t1.TOTAL_ORDER_VALUE),2) EUB_ORDER_VALUE_RATIO
from (select t.AccountNumber  ACCOUNT_NUMBER
       ,t.CustomerName  CUSTOMER_NAME
       ,t.TradeOrderValue  TRADE_ORDER_VALUE
       ,t.EUBOrderValue    EUB_ORDER_VALUE
       ,t.TotalOrderValue  TOTAL_ORDER_VALUE
       ,t.Region           REGION
From
 (select    nvl(a.Account_Number,b.Account_Number)  AccountNumber
           ,nvl(a.Customer_Name,b.Customer_Name) CustomerName
           ,nvl(a.amt,0) TradeOrderValue
           ,nvl(b.AMOUNT,0) EUBOrderValue
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) TotalOrderValue
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE))
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE))
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number=b.Account_Number(+)
UNION ALL
select    nvl(a.Account_Number,b.Account_Number)  "Account Number"
           ,nvl(a.Customer_Name,b.Customer_Name) "Customer Name"
           ,nvl(a.amt,0) "Trade Order Value"
           ,nvl(b.AMOUNT,0) "EUB Order Value"
           ,(nvl(a.amt,0) + nvl(b.AMOUNT,0)) "Total Order Value"
           ,nvl(a.region,b.region)      Region
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade')
--AND  adsih.approval_date >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID(+)
AND TRUNC(inv.TRX_DATE) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE))
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
     ,(select t.salesrep_number,decode(t.TERRITORY_CODE,'S','South',
                                                 'E','East'
                                                 ,'N','North'
                                                 ,'W','West'
                                                 ,'C','Central'
                                                 ,t.TERRITORY_CODE) Region
        from
        (select rs.salesrep_number,
        (select decode(SEGMENT4,'41','C','42','C',segment1) from apps.ra_territories where TERRITORY_ID=rst.TERRITORY_ID)   TERRITORY_CODE
        FROM   apps.jtf_rs_salesreps rs,
               apps.JTF_RS_RESOURCE_EXTNS_VL RES,
               apps.hr_organization_units hou
              ,apps.ra_salesrep_territories rst
        WHERE  hou.organization_id = rs.org_id
        --AND rs.salesrep_number = '421'
        AND rs.salesrep_number <> '421'
        AND  rs.resource_id = res.resource_id
        AND  rs.SALESREP_ID=rst.SALESREP_ID
        AND  (res.END_DATE_ACTIVE is null OR res.END_DATE_ACTIVE >=sysdate-180)
        AND  (rst.END_DATE_ACTIVE IS NULL OR rst.END_DATE_ACTIVE>=sysdate-180)
        --AND rs.resource_id=100090061
        --AND res.RESOURCE_NAME =: RESOURCE_NAME
        --AND rs.salesrep_id=100203078
        order by rs.org_id  desc) t
        group by  t.salesrep_number,t.TERRITORY_CODE) rn
where 1=1
AND   inv.invoice_id=afid.invoice_id
AND   inv.header_id=afid.header_id
AND   inv.invoice_id=wnd.delivery_id
AND   afid.line_id=afsil.line_id
AND   afid.header_id=afsil.header_id
AND   afsil.sales_indent_id=adsih.sales_indent_id
--AND   inv.CUST_ACCOUNT_NUMBER IN ('2600752473')
AND  adsih.CUST_CLASSIFICATION_MEANING IN ('Trade EUB')
--AND  inv.TRX_DATE >=sysdate -77
AND  rn.salesrep_number=adsih.SALESREP_ID
AND TRUNC(inv.TRX_DATE) BETWEEN NVL(TO_DATE('${start_date}', 'YYYY-MM-DD'), SYSDATE - 180) AND NVL(TO_DATE('${end_date}', 'YYYY-MM-DD'), TRUNC(SYSDATE))
group by inv.CUST_ACCOUNT_NUMBER
,inv.CUST_ACCOUNT_NAME   ,adsih.CUST_CLASSIFICATION_MEANING,rn.region) b
where a.Account_Number(+)=b.Account_Number) t
where t.Region LIKE '%%'     
--AND   rownum<=20
group by t.AccountNumber
       ,t.CustomerName
       ,t.TradeOrderValue
       ,t.EUBOrderValue
       ,t.TotalOrderValue
       ,t.Region
Order by t.TotalOrderValue ) t1`
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

exports.get_order_total_wrt_to_customer = (start_date, end_date) => {
       return `
       SELECT
	round(SUM(pro_lac), 2) ytd
FROM
	apps.promast pm
WHERE
	1 = 1
	AND pro_cust IN ('190294262')
	AND pm.pro_ut NOT IN (87, 126)
	AND (pro_dt) 
            BETWEEN TO_DATE('${moment(start_date).format("DD/MM/YYYY")}', 'DD-MM-YY') 
          AND
             TO_DATE('${moment(end_date).format("DD/MM/YYYY")}', 'DD-MM-YY')
       `
}