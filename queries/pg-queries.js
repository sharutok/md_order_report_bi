exports.approved_and_rejected_for_last_6_months = (_status_lookup, formattedMonthYearValues) => {
  return `
    SELECT b.formatted_month_yr, COUNT(*)
  FROM (
    SELECT
      TO_CHAR(TO_TIMESTAMP(created_at::double precision), 'DD/MM/YYYY') AS formatted_date,
      TO_CHAR(TO_TIMESTAMP(created_at::double precision), 'MM-YYYY') AS formatted_month_yr,
      *
    FROM
      orders o
    WHERE
      order_type = 'Trade EUB'
      AND status_lookup ='${_status_lookup}'
    ORDER BY
      created_at DESC
  ) b
  WHERE formatted_month_yr IN (${formattedMonthYearValues.map(value => `'${value}'`).join(', ')})
  GROUP BY b.formatted_month_yr;
    `
}

exports.approved_and_rejected_region_wise = (list_of_distributor) => {
  //   return `
  //   SELECT count(*),a.status_lookup
  // FROM (
  //     SELECT
  //         order_number,
  //         distributor_id,
  //         created_at,
  //         order_type,
  //         status_lookup,
  //         TO_DATE(formatted_date, 'DD/MM/YYYY HH24:MI:SS') AS formatted_date_date_type
  //     FROM (
  //         SELECT
  //             order_number,
  //             distributor_id,
  //             created_at,
  //             order_type,
  //             status_lookup,
  //             TO_CHAR(TO_TIMESTAMP(created_at::double precision), 'DD/MM/YYYY HH24:MI:SS') AS formatted_date
  //         FROM
  //             orders o
  //             where order_type='Trade EUB'
  //             and status_lookup in ('Approved','Rejected')
  //         ORDER BY
  //             created_at asc
  //     ) subquery_alias
  // ) a
  // WHERE  a.distributor_id in (${list_of_distributor.map(value => `'${value}'`).join(', ')})
  // group by a.status_lookup`
  return `
SELECT
    ab.*,
    round(ab.approved_count::decimal/(ab.approved_count::decimal + ab.rejected_count::decimal),2 )as approved_ratio,
    round(ab.rejected_count::decimal / (ab.approved_count::decimal + ab.rejected_count::decimal),2) as rejected_ratio
FROM (
    SELECT
        a1.a_count as approved_count,
        a1.status_approved,
        b1.a_count as rejected_count,
        b1.stauts_rejected,
        a1.a_count + b1.a_count as total_count
    FROM (
        SELECT
            COUNT(*) as a_count,
            a.status_lookup as status_approved
        FROM (
            SELECT
                order_number,
                distributor_id,
                created_at,
                order_type,
                status_lookup,
                TO_DATE(formatted_date, 'DD/MM/YYYY HH24:MI:SS') AS formatted_date_date_type
            FROM (
                SELECT
                    order_number,
                    distributor_id,
                    created_at,
                    order_type,
                    status_lookup,
                    TO_CHAR(TO_TIMESTAMP(created_at::double precision), 'DD/MM/YYYY HH24:MI:SS') AS formatted_date
                FROM
                    orders o
                WHERE
                    order_type='Trade EUB'
                    AND status_lookup IN ('Approved')
                ORDER BY
                    created_at ASC
            ) subquery_alias
        ) a
        WHERE  a.distributor_id in (${list_of_distributor.map(value => `'${value}'`).join(', ')})
        GROUP BY a.status_lookup
    ) a1
    CROSS JOIN (
        SELECT
            COUNT(*) as a_count,
            b.status_lookup as stauts_rejected
        FROM (
            SELECT
                order_number,
                distributor_id,
                created_at,
                order_type,
                status_lookup,
                TO_DATE(formatted_date, 'DD/MM/YYYY HH24:MI:SS') AS formatted_date_date_type
            FROM (
                SELECT
                    order_number,
                    distributor_id,
                    created_at,
                    order_type,
                    status_lookup,
                    TO_CHAR(TO_TIMESTAMP(created_at::double precision), 'DD/MM/YYYY HH24:MI:SS') AS formatted_date
                FROM
                    orders o
                WHERE
                    order_type='Trade EUB'
                    AND status_lookup IN ('Rejected')
                ORDER BY
                    created_at ASC
            ) subquery_alias
        ) b
        WHERE  b.distributor_id in (${list_of_distributor.map(value => `'${value}'`).join(', ')})
        GROUP BY b.status_lookup
    ) b1
) ab;`


}