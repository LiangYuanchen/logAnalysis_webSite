Drop SCHEMA infiniteinn;
CREATE SCHEMA `infiniteinn` DEFAULT CHARACTER SET utf8 ;
use infiniteinn;
CREATE TABLE `user_login_logs` (
  `project_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `server_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `open_udid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `user_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `app_id` varchar(255) COLLATE utf8_unicode_ci NOT NUll,
  `os_version` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `device_name` varchar(255) COLLATE utf8_unicode_ci NOT NUll ,
  `device_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL ,
  `device_id_type` int(11) unsigned NOT NULL,  
  `locale` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
CREATE TABLE `user_register_logs` (
 `project_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `server_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `open_udid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `user_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `app_id` varchar(255) COLLATE utf8_unicode_ci NOT NUll,
  `os_version` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `device_name` varchar(255) COLLATE utf8_unicode_ci NOT NUll ,
  `device_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL ,
  `device_id_type` int(11) unsigned NOT NULL,  
  `locale` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
CREATE TABLE `vir_money_logs` (
  `project_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `server_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `open_udid` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `ip` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `user_id` bigint(20) unsigned NOT NULL,
  `user_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `created_ts` bigint(20) unsigned not null default 0,
  `serial_no` bigint(20) unsigned NOT NULL,
  `log_type` int(11) unsigned NOT NULL,
  `vm_type` int(11) unsigned NOT NULL,
  `vm_num` bigint(20) NOT NULL,
  `chain` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `channel` int(11) unsigned DEFAULT '0',
  `balance` bigint(20) NOT NULL,
  `currency_type` int(11) unsigned DEFAULT '0',
  `pay_price` decimal(10,2) DEFAULT '0.00',
  `product_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT '' ,
    KEY `user_id_index` (`user_id`),
   KEY `created_ts_index` (`created_ts`),
  KEY `serial_no_index` (`serial_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
;
-- CREATE DATABASE tavern DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci

create table User_SnapShot(
id    bigint(8) not null auto_increment ,
User_ID bigint(8) not null ,
 User_DvcID char(40) not null,
 User_Server int(2) not null,
 region_id int(2) not null,
 Crt_DT datetime not null,
 User_name char(30) not null,
 User_Level int(2) not null, 
 User_Gld int(4) not null, 
 User_Gem_Buy int(4) not null, 
 User_Gem_Other int(4) not null, 
 User_Vip int(2) not null, 
 User_EXP int(4) not null,
 User_Energy int(2) not null,
 User_Coin int(4) not null,
 User_PvP_Coin int(4) not null,
 User_Odsy_Coin int(4) not null,
 User_Gld_Coin int(4) not null, 
 User_Swp_Tkt int(4) not null, 
 User_Fame int(4) not null, 
 User_M_Card timestamp not null, 
 User_Adv_normal int(4) not null, 
 User_Adv_Hard int(4) not null, 
 User_Odsy_Progress int(4) not null,
 User_Arena_Progress int(2) not null, 
 User_Arena_Rank int(2) not null, 
 User_Gld_quest_progress int(4) not null,
 User_Eqp_Rating_Avg float(10,2) not null, 
 User_Star_Rating_Avg float(10,2) not null,
 User_Lv_Rating_Avg float(10,2) not null, 
 User_Power_Sum int(4) not null,
 primary key(id)
 );  

create table User_Register_Logs(
User_ID bigint(8) not null primary key,
 User_DvcID char(40) not null,
 User_Server int(2) not null,
 region_id int(2) not null,
 Crt_DT datetime not null,
 User_ip char(16) not null, 
 User_country char(5) not null,
 User_name char(30) not null, 
 User_app_Ver char(40) not null,
 User_OS_Ver char(40) not null, 
 User_OS_type char(40) not null, 
 User_local char(10) not null);

create table Res_log_Gem(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Gem_Change int(4) not null ,
  Gem_Fin int(4) not null ,
  Gem_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_Coin(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Coin_Change int(4) not null ,
  Coin_Fin int(4) not null ,
  Coin_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_PvPCoin(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  PvPCoin_Change int(4) not null ,
  PvPCoin_Fin int(4) not null ,
  PvPCoin_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_Energy(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Energy_Change int(4) not null ,
  Energy_Fin int(4) not null ,
  Energy_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_GldCoin(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  GldCoin_Change int(4) not null ,
  GldCoin_Fin int(4) not null ,
  GldCoin_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_OdsyCoin(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  OdsyCoin_Change int(4) not null ,
  OdsyCoin_Fin int(4) not null ,
  OdsyCoin_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_AreaPt(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  AreaPt_Change int(4) not null ,
  AreaPt_Fin int(4) not null ,
  AreaPt_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_VIP(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  VIP_EXP_Change int(4) not null ,
  VIP_EXP_Fin int(4) not null,
  VIP_Lv_Change int(4) not null ,
  VIP_Lv_Fin int(4) not null ,
  VIP_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_Fame(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Fame_Change int(4) not null ,
  Fame_Fin int(4) not null ,
  Fame_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_EXP(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  EXP_Change int(4) not null ,
  EXP_Fin int(4) not null ,
  EXP_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_Food(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Food_ID int(4) not null ,
  Food_Change int(4) not null ,
  Food_Fin int(4) not null ,
  Food_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_itm(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  itm_ID int(4) not null ,
  itm_Change int(4) not null ,
  itm_Fin int(4) not null ,
  itm_Reason char(20) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Res_log_Eqp(
  User_ID bigint not null ,
  User_DvcID char(40) not null ,
  User_Server int(2) not null ,
  Crt_DT datetime not null ,
  Eqp_ID int(4) not null ,
  Eqp_Change int(4) not null ,
  Eqp_Fin int(4) not null ,
  Eqp_Qlt tinyint(1)  null ,
  Eqp_Qlt_fin int(3)  null ,
  Eqp_Slot tinyint(1)  null ,
  Eqp_Slot_fin varchar(20) null,
  Eqp_Room_Id int(11) null,
  Eqp_Adv_Id int(11) not null,
  Eqp_Reason char(20) not null ,
  KEY `user_id_index` (`User_ID`)
);
create table Act_log_Hero_EXP(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Hero_ID int(11) not null ,
  Hero_Name char(20) not null ,
  Hero_Level int(10) not null ,
  Hero_Star int(4) not null ,
  Exp_Amt int(20) not null ,
  Hero_Exp int not null ,
  Hero_Reason char(20) not null ,
  Hero_lv_change int(4) not null ,
  KEY  `user_id_index` (`User_ID`)
);
create table Act_log_Hero_Skill(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Hero_ID int(11) not null ,
  Hero_Name char(20) not null ,
  Hero_Level int(10) not null ,
  Hero_Star int(4) not null ,
  skill_ID int(11) not null ,  
  skill_name char(20) not null ,
  skill_lv int(9) not null ,
  skill_lv_fin int(9) not null ,
  Skill_Slot tinyint(1) not null ,
  Skill_Slot_fin int(3) not null ,
  KEY `user_id_index` (`User_ID`)  
);
create table Act_log_Hero_Eqp(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Hero_ID int(11) not null ,
  Hero_Name char(20) not null ,
  Hero_Level int(10) not null ,
  Hero_Star int(4) not null ,
  Eqp_ID int(11) not null ,
  Eqp_name char(20) not null ,
  Eqp_Qlt tinyint(1) not null ,
  Eqp_Qlt_fin int(5) not null ,
  Eqp_Slot tinyint(1) not null ,
  Eqp_Slot_fin int(3) not null ,
  Eqp_reason char(20) not null ,
  KEY `user_id_index` (`User_ID`)
);
create table Act_log_Adv(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Adv_Mode char(4) not null ,
  Adv_std_ID int(11) not null ,
  Adv_stg_name char(20) not null ,
  Adv_Change_Type char(10) not null ,
  Adv_Change_Result char(5) not null ,
  Adv_Change_Rating int(3) not null ,
  Adv_loot1 char(10) not null ,
  Adv_loot1_Amt int(11) not null ,
  Adv_loot2 char(10) not null ,
  Adv_loot2_Amt int(11) not null ,
  Adv_loot3 char(10) not null ,
  Adv_loot3_Amt int(11) not null ,
  Adv_loot4 char(10) not null ,
  Adv_loot4_Amt int(11) not null ,
  Adv_loot5 char(10) not null ,
  Adv_loot5_Amt int(11) not null ,
  Adv_loot6 char(10) not null ,
  Adv_loot6_Amt int(11) not null ,
  Adv_loot7 char(10) not null ,
  Adv_loot7_Amt int(11) not null ,
  KEY `user_id_index` (`User_ID`)
);
create table Act_log_odsy(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Odsy_Auto tinyint(1) not null ,
  Odsy_Stg_ID int(11) not null ,
  Odsy_stg_No char(20) not null ,
  Odsy_Change_Result char(5) not null ,
  Odsy_loot1 char(10) not null,
  Odsy_loot1_amt int(11) not null,
  Odsy_loot2 char(10) not null,
  Odsy_loot2_amt int(11) not null,
  Odsy_loot3 char(10) not null,
  Odsy_loot3_amt int(11) not null,
  Odsy_loot4 char(10) not null,
  Odsy_loot4_amt int(11) not null,   
  KEY `user_id_index` (`User_ID`)   
);
create table Act_log_Arena(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Arena_power int(20) not null,
  Arena_pt int(11) not null ,
  Arena_pt_Balance int(11) not null,
  Arena_rank int(11) not null,
  Arena_rank_balance int(11) not null,
  Arena_result char(5) not null ,
  Arena_emy_ID bigint(8) not null,
  Arena_emy_power int(20) not null,
  Arena_emy_pt int(11) not null,
  Arena_emy_Balance int(11) not null,
  Arena_emy_rank int(11) not null,
  Arena_emy_rank_balance int(11) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Sys_Store(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Store_Type varchar(10) not null,
  Store_itm_id int(12) not null,
  Store_itm_name varchar(20) not null,
  Store_itm_Qlt int(5) not null,
  Store_itm_amy int(12) not null,
  Store_currency_type varchar(5) not null,
  Store_itm_cost int(12) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Sys_Summon(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Sum_id varchar(30) not null ,
  Sum_isfree tinyint(1) not null ,
  Sum_type varchar(5) not null,
  Sum_currency_type varchar(5) not null,
  Sum_cost int(11) not null,
  Sum_hero_id int(12) not null,
  Sum_hero_name varchar(20) not null,
  Sum_hero_star int(3) not null,
  Sum_hero_exist tinyint(1) not null,
  Sum_loot1 varchar(10) not null,
  Sum_loot1_amt int(12) not null,
  Sum_loot2 varchar(10) not null,
  Sum_loot2_amt int(12) not null,
  Sum_loot3 varchar(10) not null,
  Sum_loot3_amt int(12) not null,  
  KEY `user_id_index` (`User_ID`)
);
create table Sys_orders(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  Order_currency_type varchar(5) not null,
  Order_price int(11) not null,
  Order_success tinyint(1) not null,
  Order_portal varchar(5) not null,
  Order_gem int(11) not null,
  Order_Vip_Exp int(11) not null,
  Order_kind_id varchar(20)  not null,
  Order_Invoice varchar(20) not null,
  Order_Channel varchar(5) not null,
  Order_Pkg_ID int(12) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Payuser_Status_SnapShot(
  User_ID bigint(8) not null ,
  User_DvcID char(40) not null ,
  User_Server int(11) not null ,
  Crt_DT datetime not null ,
  User_dvc_ID char(40) not null,
  User_dvc_type char(10) not null,
  User_OS_ver varchar(20) not null,
  app_ver varchar(20) not null,  
  User_country varchar(5) not null,
  User_lv int(11) not null,
  user_online int(11) not null,
  user_pay_amt int(11) not null,
  User_pay_times int(11) not null,
  User_pay_all int(11) not null,
  User_Cost_Fin int(11) not null,
  User_Gem_Fin int(11) not null,
  User_eng_cost int(11) not null,
  User_speed_cost int(11) not null,
  User_fill_cost int(11) not null,
  User_shop_cost int(11) not null,
  User_adv_N_stg varchar(10) not null,
  User_adv_H_stg varchar(10) not null,
  User_Arena_pt int(11) not null,
  User_Arena_rank int(11) not null,
  User_Arena_Rate int(11) not null,
  KEY `user_id_index` (`User_ID`)
);
create table Gld_SnapShot(
  Gld_ID      int(11)   not null,
  Gld_Server  int(10)   not null,
  Crt_DT      datetime  not null, 
  Gld_Level   int(10)   not null,
  Gld_Exp     int(11)   not null,
  Gld_member  int(11)   not null,
  Gld_Quest_stge  varchar(20) not null,
  Gld_btl_win_his int(11) not null,
  Gld_btl_draw_his int(11)  not null,
  Gld_btl_lose_his int(11) not null,
  Gld_btl_att      int(11) not null,
  Gld_btl_win_tms int(11) not null,
  Gld_btl_draw_tms int(11) not null,
  Gld_btl_lose_tms int(11) not null,
  Gld_btl_win       int(11) null,
  Gld_btl_emy_id    int(11) null,
  KEY `gld_id_index`(`Gld_ID`)
);
create table Dis_Base(
  Type_ID int(11) not null,
  Type_Name varchar(40) not null
);
-- alter table Res_log_Eqp add column  Eqp_Room_Id int(11) null;
-- alter table Res_log_Eqp add column Eqp_Adv_Id int(11) null;
-- alter table User_SnapShot change User_Adv_normal User_Adv_normal varchar(20) null;
--alter table User_SnapShot change User_Adv_Hard User_Adv_Hard varchar(20) null;
--alter table User_SnapShot change User_Odsy_Progress User_Odsy_Progress varchar(20) null;

-- create table Guild_Qst_SnapShot(
--   Guild_ID        int(11)   not null,
--   User_Server     int(11)   not null,
--   Crt_DT          int(11)   not null,
--   Stg_ID          int(11)   not null,
--   Att_amt         int(11)   not null,
--   Mbr_amt         int(11)   not null,
--   Qst_Amt         int(11)   not null,
--   Qst_win         int(11)   not null,
--   Qst_lose        int(11)   not null,
--   KEY `gld_id_index` (`Guild_ID`)
-- );

-- create table Gld_btl_log(
--   Gld_btl_ID int(11) not null,
--   User_Server int(11) not null,
--   Crt_DT datetime not null,
--   Gld_Btl_ID_A int(11) not null,
--   Gld_Btl_att_A int(11) not null,
--   Gld_mbr_amt_A int(11) not null,
--   Gld_btl_times_A int(11) not null,
--   Gld_Btl_fin smallint(2) not null,
--   Gld_Btl_ID_B int(11) not null,
--   Gld_Btl_att_B int(11) not null,
--   Gld_Btl_amt_B int(11) not null,
--   Gld_mbr_amt_B int(11) not null,
--   Gld_btl_times_B int(11) not null,
--   KEY `gld_btl_id_index` (`Gld_btl_ID`)
-- );

